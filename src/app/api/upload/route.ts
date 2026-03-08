import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `${Date.now()}-${file.name.replaceAll(' ', '_')}`;

    const publicUploads = path.join(process.cwd(), 'public', 'uploads');

    try {
      await mkdir(publicUploads, { recursive: true });
    } catch (e) {
      // Ignora erro se diretório já existe
    }

    await writeFile(path.join(publicUploads, filename), buffer);

    return NextResponse.json({ url: `/uploads/${filename}` });
  } catch (error) {
    console.error('Upload falhou:', error);
    return NextResponse.json({ error: 'Erro ao fazer upload da imagem.' }, { status: 500 });
  }
}
