import fs from 'node:fs/promises';
import path from 'node:path';
import 'dotenv/config';
import { prisma } from '../lib/prisma';
import { formatTicketNumber } from '../core/tickets/format';

type LegacyRecord = Record<string, string | null>;

type ParsedTable = {
  columns: string[];
  rows: LegacyRecord[];
};

type InsertStatement = {
  columnsRaw: string;
  valuesChunk: string;
};

function slugify(input: string): string {
  const base = input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

  return base || 'tenant';
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

function parseLegacyDate(dateValue: string | null, hourValue?: string | null): Date | null {
  if (!dateValue) return null;

  const date = dateValue.trim();
  if (!date) return null;

  if (/^\d{4}-\d{2}-\d{2}/.test(date)) {
    const parsed = new Date(date);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
    const [dd, mm, yyyy] = date.split('/').map(Number);
    const time = (hourValue ?? '00:00:00').trim() || '00:00:00';
    const parsed = new Date(`${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}T${time}Z`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

function normalizeLegacyBcrypt(hash: string): string {
  return hash.startsWith('$2y$') ? `$2b$${hash.slice(4)}` : hash;
}

function extractColumnNames(raw: string): string[] {
  const names: string[] = [];
  const regex = /`([^`]+)`/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(raw)) !== null) {
    names.push(match[1]);
  }
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
    if (raw === null || raw.toUpperCase() === 'NULL') {
      record[column] = null;
    } else {
      record[column] = raw;
    }
  });
  return record;
}

function extractInsertStatements(sql: string, tableName: string): InsertStatement[] {
  const marker = `INSERT INTO \`${tableName}\``;
  const statements: InsertStatement[] = [];
  let cursor = 0;

  while (true) {
    const insertIndex = sql.indexOf(marker, cursor);
    if (insertIndex === -1) {
      break;
    }

    const columnsStart = sql.indexOf('(', insertIndex);
    if (columnsStart === -1) {
      break;
    }

    const columnsEnd = sql.indexOf(')', columnsStart);
    if (columnsEnd === -1) {
      break;
    }

    const valuesKeywordIndex = sql.indexOf('VALUES', columnsEnd);
    if (valuesKeywordIndex === -1) {
      break;
    }

    const valuesStart = valuesKeywordIndex + 'VALUES'.length;
    let index = valuesStart;
    let depth = 0;
    let inString = false;
    let escapeNext = false;
    let statementEnd = -1;

    while (index < sql.length) {
      const char = sql[index];

      if (inString) {
        if (escapeNext) {
          escapeNext = false;
        } else if (char === '\\') {
          escapeNext = true;
        } else if (char === "'") {
          inString = false;
        }

        index += 1;
        continue;
      }

      if (char === "'") {
        inString = true;
        index += 1;
        continue;
      }

      if (char === '(') {
        depth += 1;
        index += 1;
        continue;
      }

      if (char === ')') {
        depth = Math.max(0, depth - 1);
        index += 1;
        continue;
      }

      if (char === ';' && depth === 0) {
        statementEnd = index;
        break;
      }

      index += 1;
    }

    if (statementEnd === -1) {
      break;
    }

    statements.push({
      columnsRaw: sql.slice(columnsStart + 1, columnsEnd),
      valuesChunk: sql.slice(valuesStart, statementEnd),
    });

    cursor = statementEnd + 1;
  }

  return statements;
}

function parseTable(sql: string, tableName: string): ParsedTable {
  const rows: LegacyRecord[] = [];
  let columns: string[] = [];
  const statements = extractInsertStatements(sql, tableName);

  for (const statement of statements) {
    columns = extractColumnNames(statement.columnsRaw);
    const tuples = parseTupleChunk(statement.valuesChunk);
    for (const tuple of tuples) {
      rows.push(mapTupleToRecord(columns, tuple));
    }
  }

  return { columns, rows };
}

async function ensureUniqueUserEmail(baseEmail: string): Promise<string> {
  const [localPartRaw, domainPartRaw] = baseEmail.includes('@')
    ? baseEmail.split('@')
    : [baseEmail, 'legacy.local'];

  const localPart = localPartRaw || 'usuario';
  const domainPart = domainPartRaw || 'legacy.local';

  let candidate = `${localPart}@${domainPart}`;
  let index = 1;

  while (await prisma.user.findUnique({ where: { email: candidate }, select: { id: true } })) {
    candidate = `${localPart}+legacy${index}@${domainPart}`;
    index += 1;
  }

  return candidate;
}

async function ensureUniqueTenantSlug(base: string): Promise<string> {
  let candidate = base;
  let index = 1;

  while (await prisma.tenant.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    candidate = `${base}-${index}`;
    index += 1;
  }

  return candidate;
}

async function ensureAvailableCustomDomain(domain: string | null): Promise<string | null> {
  if (!domain) return null;

  const exists = await prisma.tenant.findUnique({
    where: { customDomain: domain },
    select: { id: true },
  });

  return exists ? null : domain;
}

async function ensureAvailableExternalId(externalId: string | null): Promise<string | null> {
  if (!externalId || externalId.trim().length === 0) {
    return null;
  }

  const normalized = externalId.trim();
  const exists = await prisma.payment.findUnique({
    where: { externalId: normalized },
    select: { id: true },
  });

  return exists ? null : normalized;
}

async function main() {
  const sqlPath = process.argv[2] ?? 'c:/Users/Bunny/Downloads/trgustav_app.sql';
  const resolvedSqlPath = path.resolve(sqlPath);

  const sql = await fs.readFile(resolvedSqlPath, 'utf8');

  const configTable = parseTable(sql, 'config');
  const usersTable = parseTable(sql, 'users');
  const clientsTable = parseTable(sql, 'clients');
  const ticketsTable = parseTable(sql, 'tickets');
  const paymentsTable = parseTable(sql, 'payment');
  const numbersTable = parseTable(sql, 'numbers');
  const numberWinTable = parseTable(sql, 'numberwin');
  const promoCodeTable = parseTable(sql, 'promocode');

  if (configTable.rows.length === 0) {
    throw new Error('Tabela config vazia no dump legado.');
  }

  const config = configTable.rows[0];
  const legacyOwner = usersTable.rows[0];

  const tenantName = config.name ?? 'Tenant Legacy';
  const tenantSlugBase = slugify(String(config.name ?? 'tenant-legacy'));
  const tenantSlug = await ensureUniqueTenantSlug(tenantSlugBase);

  const ownerEmailBase = normalizeEmail(legacyOwner?.email ?? 'owner@legacy.local');
  const ownerEmail = await ensureUniqueUserEmail(ownerEmailBase);
  const ownerName = `${legacyOwner?.first_name ?? 'Owner'} ${legacyOwner?.last_name ?? 'Legacy'}`.trim();
  const ownerPassword = legacyOwner?.passwd
    ? normalizeLegacyBcrypt(legacyOwner.passwd)
    : normalizeLegacyBcrypt('$2y$10$TfhL4M8xX96yA8CL4lSXte9gPqM2RTQxMez3n4mqp8Syy4QduJGHq');

  const owner = await prisma.user.create({
    data: {
      name: ownerName,
      email: ownerEmail,
      password: ownerPassword,
      role: 'ADMIN',
    },
    select: { id: true },
  });

  let customDomain: string | null = null;
  const rawDomain = (config.domain ?? '').trim();
  if (rawDomain) {
    try {
      const parsed = new URL(rawDomain);
      customDomain = parsed.hostname || null;
    } catch {
      customDomain = rawDomain.replace(/^https?:\/\//i, '').replace(/\/$/, '') || null;
    }
  }

  customDomain = await ensureAvailableCustomDomain(customDomain);

  const tenant = await prisma.tenant.create({
    data: {
      ownerId: owner.id,
      name: tenantName,
      slug: tenantSlug,
      customDomain,
      logoUrl: config.logo ?? null,
      mpAccessToken: config.token ?? null,
      isActive: String(config.maintenance ?? 'false').toLowerCase() !== 'true',
    },
    select: { id: true, slug: true, name: true },
  });

  const clientIdMap = new Map<number, string>();
  for (const legacyClient of clientsTable.rows) {
    const legacyId = parsePositiveInt(legacyClient.id, 0);
    if (!legacyId) continue;

    const cpf = normalizeCpf(legacyClient.cpf);
    if (!cpf) continue;

    const client = await prisma.client.upsert({
      where: {
        tenantId_cpf: {
          tenantId: tenant.id,
          cpf,
        },
      },
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
  }

  const raffleIdMap = new Map<number, string>();
  for (const legacyTicket of ticketsTable.rows) {
    const legacyId = parsePositiveInt(legacyTicket.id, 0);
    if (!legacyId) continue;

    const legacyName = (legacyTicket.name ?? '').trim() || `Rifa Legacy ${legacyId}`;
    const raffleSlugBase = slugify(`${legacyName}-${legacyId}`).slice(0, 55);
    let raffleSlug = raffleSlugBase;
    let suffix = 1;
    while (
      await prisma.raffle.findFirst({
        where: { tenantId: tenant.id, slug: raffleSlug },
        select: { id: true },
      })
    ) {
      suffix += 1;
      raffleSlug = `${raffleSlugBase}-${suffix}`;
    }

    const price = parseNumber(legacyTicket.price, 0.1);
    const minNumbers = parsePositiveInt(legacyTicket.cota, 1);
    const totalNumbers = parsePositiveInt(legacyTicket.maxTickets, 999999);
    const drawDate = parseLegacyDate(legacyTicket.date, legacyTicket.hour);
    const legacyStatus = String(legacyTicket.status ?? '').trim();
    const status = legacyStatus === '1' ? 'ACTIVE' : 'FINISHED';

    const raffle = await prisma.raffle.create({
      data: {
        tenantId: tenant.id,
        slug: raffleSlug,
        title: legacyName,
        description: legacyTicket.description ?? null,
        bannerUrl: legacyTicket.img ?? null,
        price,
        minNumbers,
        totalNumbers,
        status,
        drawDate,
      },
      select: { id: true },
    });

    raffleIdMap.set(legacyId, raffle.id);
  }

  for (const legacyTicket of ticketsTable.rows) {
    const legacyWinnerClientId = parsePositiveInt(legacyTicket.winner, 0);
    const legacyTicketId = parsePositiveInt(legacyTicket.id, 0);
    if (!legacyWinnerClientId || !legacyTicketId) continue;

    const winnerClientId = clientIdMap.get(legacyWinnerClientId);
    const raffleId = raffleIdMap.get(legacyTicketId);
    if (!winnerClientId || !raffleId) continue;

    await prisma.raffle.update({
      where: { id: raffleId },
      data: { winnerId: winnerClientId },
    });
  }

  const numbersByPayment = new Map<number, Array<{ numberFormatted: string; number: number; ticketId: number; clientId: number; createdAt: Date | null }>>();
  const maxTicketByRaffle = new Map<string, number>();

  for (const legacyNumber of numbersTable.rows) {
    const paymentId = parsePositiveInt(legacyNumber.payment, 0);
    const ticketId = parsePositiveInt(legacyNumber.ticket, 0);
    const clientId = parsePositiveInt(legacyNumber.client, 0);
    const numberFormattedRaw = (legacyNumber.numbers ?? '').trim();
    const numberFormatted = numberFormattedRaw.padStart(6, '0').slice(-6);
    const numeric = Number.parseInt(numberFormatted, 10);
    if (!paymentId || !ticketId || !clientId || !Number.isFinite(numeric)) continue;

    const list = numbersByPayment.get(paymentId) ?? [];
    list.push({
      numberFormatted,
      number: numeric,
      ticketId,
      clientId,
      createdAt: parseLegacyDate(legacyNumber.created_at),
    });
    numbersByPayment.set(paymentId, list);
  }

  for (const legacyPayment of paymentsTable.rows) {
    const legacyPaymentId = parsePositiveInt(legacyPayment.id, 0);
    const legacyClientId = parsePositiveInt(legacyPayment.client, 0);
    const legacyTicketId = parsePositiveInt(legacyPayment.ticket, 0);

    const clientId = clientIdMap.get(legacyClientId);
    const raffleId = raffleIdMap.get(legacyTicketId);
    if (!legacyPaymentId || !clientId || !raffleId) continue;

    const numbers = numbersByPayment.get(legacyPaymentId) ?? [];
    const ticketCount = numbers.length > 0 ? numbers.length : parsePositiveInt(legacyPayment.amount, 1);

    const raffle = await prisma.raffle.findUnique({
      where: { id: raffleId },
      select: { price: true },
    });

    const priceTotal = parseNumber(legacyPayment.priceTotal, 0);
    const fallbackAmount = raffle ? Number(raffle.price) * ticketCount : ticketCount;
    const amount = priceTotal > 0 ? priceTotal : fallbackAmount;

    const legacyStatus = String(legacyPayment.status ?? '').trim().toLowerCase();
    const status = legacyStatus === 'approved' ? 'APPROVED' : legacyStatus === 'cancelled' ? 'CANCELLED' : 'PENDING';
    const externalId = await ensureAvailableExternalId(legacyPayment.codPayment ?? null);

    const payment = await prisma.payment.create({
      data: {
        tenantId: tenant.id,
        raffleId,
        clientId,
        amount,
        ticketCount,
        status,
        externalId,
        processedAt: status === 'APPROVED' ? parseLegacyDate(legacyPayment.updated_at) : null,
        metadata: {
          legacy: {
            paymentId: legacyPayment.id,
            ip: legacyPayment.ip,
            ipv6: legacyPayment.ipv6,
            agent: legacyPayment.agent,
            type: legacyPayment.type,
            amountRaw: legacyPayment.amount,
            priceTotalRaw: legacyPayment.priceTotal,
            codPaymentRaw: legacyPayment.codPayment,
            codPaymentImportedAsExternalId: externalId,
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

      const currentMax = maxTicketByRaffle.get(raffleId) ?? 0;
      const maxFromBatch = numbers.reduce((acc, item) => Math.max(acc, item.number), 0);
      maxTicketByRaffle.set(raffleId, Math.max(currentMax, maxFromBatch));
    }
  }

  for (const [raffleId, maxNumber] of maxTicketByRaffle.entries()) {
    await prisma.raffle.update({
      where: { id: raffleId },
      data: { nextTicketNumber: maxNumber + 1 },
    });
  }

  const auditDir = path.resolve('src/prisma/legacy-import-audit');
  await fs.mkdir(auditDir, { recursive: true });

  const auditPath = path.join(auditDir, `${tenant.slug}.json`);
  await fs.writeFile(
    auditPath,
    JSON.stringify(
      {
        sourceFile: resolvedSqlPath,
        importedAt: new Date().toISOString(),
        tenant: {
          id: tenant.id,
          slug: tenant.slug,
          name: tenant.name,
        },
        importedCounts: {
          users: usersTable.rows.length,
          clients: clientsTable.rows.length,
          raffles: ticketsTable.rows.length,
          payments: paymentsTable.rows.length,
          numbers: numbersTable.rows.length,
        },
        legacyOnlyData: {
          config: configTable.rows,
          numberwin: numberWinTable.rows,
          promocode: promoCodeTable.rows,
        },
      },
      null,
      2
    ),
    'utf8'
  );

  console.log('Importacao concluida com sucesso.');
  console.log(`Tenant: ${tenant.slug} (${tenant.id})`);
  console.log(`Auditoria: ${auditPath}`);
}

main()
  .catch((error) => {
    console.error('Falha na importacao legada:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });