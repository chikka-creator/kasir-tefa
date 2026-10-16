/**
 * Sinkronkan password (dan PIN guru) pada akun yang SUDAH ADA dengan nilai dari
 * environment variable. Berguna untuk reset kredensial operasional tanpa menghapus
 * akun. Akun yang password-nya tidak diatur di env akan dilewati.
 *
 *   npx tsx prisma/set-credentials.ts
 */
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

interface AccountSpec {
  label: string;
  role: Role;
  username: string;
  password?: string;
  pin?: string;
}

async function main() {
  const accounts: AccountSpec[] = [
    {
      label: "ADMIN",
      role: Role.ADMIN,
      username: process.env.INITIAL_ADMIN_USERNAME || "kasir_tefa",
      password: process.env.INITIAL_ADMIN_PASSWORD,
    },
    {
      label: "TEACHER",
      role: Role.TEACHER,
      username: process.env.INITIAL_TEACHER_USERNAME || "guru_tefa",
      password: process.env.INITIAL_TEACHER_PASSWORD,
      pin: process.env.INITIAL_TEACHER_PIN,
    },
    {
      label: "AUDIT",
      role: Role.AUDIT,
      username: process.env.INITIAL_AUDIT_USERNAME || "audit_sekolah",
      password: process.env.INITIAL_AUDIT_PASSWORD,
    },
  ];

  const saltRounds = 10;
  let updated = 0;
  let skipped = 0;

  for (const acc of accounts) {
    const user = await prisma.user.findUnique({ where: { username: acc.username } });

    if (!user) {
      console.log(`  - ${acc.label.padEnd(8)} ${acc.username}: akun tidak ada, dilewati`);
      skipped++;
      continue;
    }

    if (user.role !== acc.role) {
      throw new Error(
        `Role akun '${acc.username}' adalah ${user.role}, bukan ${acc.role}. Periksa INITIAL_*_USERNAME.`
      );
    }

    if (!acc.password && !acc.pin) {
      console.log(`  - ${acc.label.padEnd(8)} ${acc.username}: tidak ada kredensial di env, dilewati`);
      skipped++;
      continue;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(acc.password ? { password_hash: await bcrypt.hash(acc.password, saltRounds) } : {}),
        ...(acc.pin ? { supervisor_pin_hash: await bcrypt.hash(acc.pin, saltRounds) } : {}),
      },
    });

    const changed = [
      acc.password ? "password" : null,
      acc.pin ? "PIN" : null,
    ].filter(Boolean).join(" + ");

    console.log(`  + ${acc.label.padEnd(8)} ${acc.username}: ${changed} diperbarui`);
    updated++;
  }

  console.log(`\nSelesai. ${updated} akun diperbarui, ${skipped} dilewati.`);
}

main()
  .catch((e) => {
    console.error("Error:", e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });