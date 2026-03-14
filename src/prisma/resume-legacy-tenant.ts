import fs from 'node:fs/promises';
import path from 'node:path';
import 'dotenv/config';
import { prisma } from '../lib/prisma';
import { formatTicketNumber } from '../core/tickets/format';

type LegacyRecord = Record<string, string | null>;

type InsertStatement = {
  columnsRaw: string;
  valuesChunk: string;
};

function slugify(input: string): string {
  return (
    input
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-{2,}/g, '-') || 'tenant'
  );
}

function normalizeCpf(cpf: string | null): string {
  return (cpf ?? '').replace(/\D/g, '');
}

function normalizeEmail(email: string | null): string {
  const value = (email ?? '').trim().toLowerCase();
  return value.length > 0 ? value : 'nao-informado@legacy.local';
}

function parsePositiveInt(value: string | null, fallback = 0): number {
  const parsed = Number.parseInt((value ?? '').trim(), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseNumber(value: string | null, fallback = 0): number {
  const normalized = (value ?? '').replace(',', '.').trim();
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseLegacyDate(value: string | null): Date | null {
  if (!value) return null;
  const v = value.trim();
  if (!v) return null;
  const d = new Date(v.replace(' ', 'T') + 'Z');
  return Number.isNaN(d.getTime()) ? null : d;
}

function extractColumnNames(raw: string): string[] {
  const names: string[] = [];
  const regex = /`([^`]+)`/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(raw)) !== null) names.push(match[1]);
  return names;
}

function parseTupleChunk(chunk: string): string[][] {
  const tuples: string[][] = [];
  let index = 0;

  while (index < chunk.length) {
    while (index < chunk.length && chunk[index] !== '(') index += 1;
    if (index >= chunk.length) break;

    index += 1;
    const values: string[] = [];
    let token = '';
    let inString = false;
    let escapeNext = false;

    while (index < chunk.length) {
      const char = chunk[index];

      if (inString) {
        if (escapeNext) {
          token += char;
          escapeNext = false;
        } else if (char === '\\') {
          escapeNext = true;
        } else if (char === "'") {
          inString = false;
        } else {
          token += char;
        }
        index += 1;
        continue;
      }

      if (char === "'") {
        inString = true;
        index += 1;
        continue;
      }

      if (char === ',') {
        values.push(token.trim());
        token = '';
        index += 1;
        continue;
      }

      if (char === ')') {
        values.push(token.trim());
        token = '';
        index += 1;
        break;
      }

      token += char;
      index += 1;
    }

    tuples.push(values);
  }

  return tuples;
}

function mapTupleToRecord(columns: string[], tuple: string[]): LegacyRecord {
  const record: LegacyRecord = {};
  columns.forEach((column, idx) => {
    const raw = tuple[idx] ?? null;
    record[column] = raw === null || raw.toUpperCase() === 'NULL' ? null : raw;
  });
  return record;
}

function extractInsertStatements(sql: string, tableName: string): InsertStatement[] {
  const marker = `INSERT INTO \`${tableName}\``;
  const statements: InsertStatement[] = [];
  let cursor = 0;

  while (true) {
    const insertIndex = sql.indexOf(marker, cursor);
    if (insertIndex === -1) break;

    const columnsStart = sql.indexOf('(', insertIndex);
    const columnsEnd = columnsStart === -1 ? -1 : sql.indexOf(')', columnsStart);
    const valuesKeywordIndex = columnsEnd === -1 ? -1 : sql.indexOf('VALUES', columnsEnd);
    if (columnsStart === -1 || columnsEnd === -1 || valuesKeywordIndex === -1) break;

    const valuesStart = valuesKeywordIndex + 'VALUES'.length;
    let index = valuesStart;
    let depth = 0;
    let inString = false;
    let escapeNext = false;
    let statementEnd = -1;

    while (index < sql.length) {
      const char = sql[index];

      if (inString) {
        if (escapeNext) escapeNext = false;
        else if (char === '\\') escapeNext = true;
        else if (char === "'") inString = false;
        index += 1;
        continue;
      }

      if (char === "'") {
        inString = true;
        index += 1;
        continue;
      }

      if (char === '(') depth += 1;
      if (char === ')') depth = Math.max(0, depth - 1);

      if (char === ';' && depth === 0) {
        statementEnd = index;
        break;
      }

      index += 1;
    }

    if (statementEnd === -1) break;

    statements.push({
      columnsRaw: sql.slice(columnsStart + 1, columnsEnd),
      valuesChunk: sql.slice(valuesStart, statementEnd),
    });

    cursor = statementEnd + 1;
  }

  return statements;
}

function parseTable(sql: string, tableName: string): LegacyRecord[] {
  const rows: LegacyRecord[] = [];
  const statements = extractInsertStatements(sql, tableName);

  for (const statement of statements) {
    const columns = extractColumnNames(statement.columnsRaw);
    const tuples = parseTupleChunk(statement.valuesChunk);
    for (const tuple of tuples) {
      rows.push(mapTupleToRecord(columns, tuple));
    }
  }

  return rows;
}

function getLegacyPaymentIdFromMetadata(metadata: unknown): number | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null;
  const legacy = (metadata as Record<string, unknown>).legacy;
  if (!legacy || typeof legacy !== 'object' || Array.isArray(legacy)) return null;
  const value = (legacy as Record<string, unknown>).paymentId;
  const n = typeof value === 'string' ? Number.parseInt(value, 10) : typeof value === 'number' ? value : NaN;
  return Number.isFinite(n) ? n : null;
}

async function main() {
  const sqlPath = process.argv[2] ?? 'c:/Users/Bunny/Downloads/trgustav_app.sql';
  const tenantSlug = process.argv[3] ?? 'tr-gustavin-1';
  const resolvedSqlPath = path.resolve(sqlPath);

  const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug }, select: { id: true, slug: true, name: true } });
  if (!tenant) throw new Error(`Tenant ${tenantSlug} nao encontrada.`);

  console.log(`[resume] tenant: ${tenant.slug} (${tenant.id})`);
  const sql = await fs.readFile(resolvedSqlPath, 'utf8');

  const clientsTable = parseTable(sql, 'clients');
  const ticketsTable = parseTable(sql, 'tickets');
  const paymentsTable = parseTable(sql, 'payment');
  const numbersTable = parseTable(sql, 'numbers');

  console.log(`[resume] parsed rows => clients:${clientsTable.length} tickets:${ticketsTable.length} payments:${paymentsTable.length} numbers:${numbersTable.length}`);

  const clientIdMap = new Map<number, string>();
  let clientCount = 0;
  for (const legacyClient of clientsTable) {
    const legacyId = parsePositiveInt(legacyClient.id, 0);
    if (!legacyId) continue;

    const cpf = normalizeCpf(legacyClient.cpf);
    if (!cpf) continue;

    const client = await prisma.client.upsert({
      where: { tenantId_cpf: { tenantId: tenant.id, cpf } },
      update: {
        name: (legacyClient.name ?? '').trim() || 'Cliente Legacy',
        phone: (legacyClient.phone ?? '').trim(),
        email: normalizeEmail(legacyClient.email),
      },
      create: {
        tenantId: tenant.id,
        name: (legacyClient.name ?? '').trim() || 'Cliente Legacy',
        cpf,
        phone: (legacyClient.phone ?? '').trim(),
        email: normalizeEmail(legacyClient.email),
      },
      select: { id: true },
    });

    clientIdMap.set(legacyId, client.id);
    clientCount += 1;
    if (clientCount % 100 === 0) console.log(`[resume] clients processed: ${clientCount}`);
  }

  const raffleIdMap = new Map<number, string>();
  for (const legacyTicket of ticketsTable) {
    const legacyId = parsePositiveInt(legacyTicket.id, 0);
    if (!legacyId) continue;

    const title = (legacyTicket.name ?? '').trim() || `Rifa Legacy ${legacyId}`;
    const slug = slugify(`${title}-${legacyId}`).slice(0, 55);

    const existing = await prisma.raffle.findFirst({
      where: { tenantId: tenant.id, slug },
      select: { id: true },
    });

    if (existing) {
      raffleIdMap.set(legacyId, existing.id);
      continue;
    }

    const raffle = await prisma.raffle.create({
      data: {
        tenantId: tenant.id,
        slug,
        title,
        description: legacyTicket.description ?? null,
        bannerUrl: legacyTicket.img ?? null,
        price: parseNumber(legacyTicket.price, 0.1),
        minNumbers: parsePositiveInt(legacyTicket.cota, 1),
        totalNumbers: parsePositiveInt(legacyTicket.maxTickets, 999999),
        status: String(legacyTicket.status ?? '').trim() === '1' ? 'ACTIVE' : 'FINISHED',
      },
      select: { id: true },
    });

    raffleIdMap.set(legacyId, raffle.id);
  }

  const numbersByPayment = new Map<number, Array<{ number: number; createdAt: Date | null }>>();
  for (const legacyNumber of numbersTable) {
    const paymentId = parsePositiveInt(legacyNumber.payment, 0);
    const numberFormattedRaw = (legacyNumber.numbers ?? '').trim();
    const numberFormatted = numberFormattedRaw.padStart(6, '0').slice(-6);
    const number = Number.parseInt(numberFormatted, 10);
    if (!paymentId || !Number.isFinite(number)) continue;

    const list = numbersByPayment.get(paymentId) ?? [];
    list.push({ number, createdAt: parseLegacyDate(legacyNumber.created_at) });
    numbersByPayment.set(paymentId, list);
  }

  const existingPayments = await prisma.payment.findMany({
    where: { tenantId: tenant.id },
    select: { id: true, metadata: true },
  });
  const importedLegacyPaymentIds = new Set<number>();
  for (const payment of existingPayments) {
    const legacyPaymentId = getLegacyPaymentIdFromMetadata(payment.metadata);
    if (legacyPaymentId) importedLegacyPaymentIds.add(legacyPaymentId);
  }

  let processedPayments = 0;
  let createdPayments = 0;
  for (const legacyPayment of paymentsTable) {
    const legacyPaymentId = parsePositiveInt(legacyPayment.id, 0);
    if (!legacyPaymentId || importedLegacyPaymentIds.has(legacyPaymentId)) continue;

    const legacyClientId = parsePositiveInt(legacyPayment.client, 0);
    const legacyTicketId = parsePositiveInt(legacyPayment.ticket, 0);
    const clientId = clientIdMap.get(legacyClientId);
    const raffleId = raffleIdMap.get(legacyTicketId);
    if (!clientId || !raffleId) continue;

    const numbers = numbersByPayment.get(legacyPaymentId) ?? [];
    const ticketCount = numbers.length > 0 ? numbers.length : parsePositiveInt(legacyPayment.amount, 1);
    const legacyStatus = String(legacyPayment.status ?? '').trim().toLowerCase();
    const status = legacyStatus === 'approved' ? 'APPROVED' : legacyStatus === 'cancelled' ? 'CANCELLED' : 'PENDING';

    const payment = await prisma.payment.create({
      data: {
        tenantId: tenant.id,
        raffleId,
        clientId,
        amount: parseNumber(legacyPayment.priceTotal, 0),
        ticketCount,
        status,
        externalId: `legacy-${tenant.id}-${legacyPaymentId}`,
        processedAt: status === 'APPROVED' ? parseLegacyDate(legacyPayment.updated_at) : null,
        metadata: {
          legacy: {
            paymentId: legacyPayment.id,
            codPaymentRaw: legacyPayment.codPayment,
            amountRaw: legacyPayment.amount,
            priceTotalRaw: legacyPayment.priceTotal,
            ip: legacyPayment.ip,
            ipv6: legacyPayment.ipv6,
            agent: legacyPayment.agent,
          },
        },
      },
      select: { id: true },
    });

    if (numbers.length > 0) {
      await prisma.ticket.createMany({
        data: numbers.map((item) => ({
          raffleId,
          clientId,
          paymentId: payment.id,
          number: item.number,
          numberFormatted: formatTicketNumber(item.number),
          createdAt: item.createdAt ?? undefined,
        })),
        skipDuplicates: true,
      });
    }

    importedLegacyPaymentIds.add(legacyPaymentId);
    processedPayments += 1;
    createdPayments += 1;
    if (processedPayments % 25 === 0) {
      console.log(`[resume] payments created: ${createdPayments}`);
    }
  }

  const maxTicketByRaffle = await prisma.ticket.groupBy({
    by: ['raffleId'],
    _max: { number: true },
    where: { raffle: { tenantId: tenant.id } },
  });

  for (const item of maxTicketByRaffle) {
    const max = item._max.number ?? 0;
    await prisma.raffle.update({ where: { id: item.raffleId }, data: { nextTicketNumber: max + 1 } });
  }

  const counts = {
    clients: await prisma.client.count({ where: { tenantId: tenant.id } }),
    raffles: await prisma.raffle.count({ where: { tenantId: tenant.id } }),
    payments: await prisma.payment.count({ where: { tenantId: tenant.id } }),
    tickets: await prisma.ticket.count({ where: { raffle: { tenantId: tenant.id } } }),
  };

  console.log('[resume] done', { createdPayments, counts });
}

main()
  .catch((error) => {
    console.error('Falha no resume legado:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
