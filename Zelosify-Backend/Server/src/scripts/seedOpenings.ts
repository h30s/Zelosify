import prisma from "../config/prisma/prisma.js";
import { Role, OpeningStatus, AuthProvider } from "@prisma/client";

/**
 * Seeds the database with Bruce Wayne Corp tenant, users, and at least 12 openings.
 */
export async function seedOpenings() {
  try {
    console.log("🌱 Seeding Bruce Wayne Corp and openings...");

    // 1. Create or update primary Tenant: "Bruce Wayne Corp"
    const wayneTenant = await prisma.tenants.upsert({
      where: { tenantId: "tenant-bruce-wayne" },
      update: { companyName: "Bruce Wayne Corp" },
      create: {
        tenantId: "tenant-bruce-wayne",
        companyName: "Bruce Wayne Corp",
      },
    });

    // Create a secondary Tenant for isolation testing: "LexCorp"
    const lexTenant = await prisma.tenants.upsert({
      where: { tenantId: "tenant-lexcorp" },
      update: { companyName: "LexCorp" },
      create: {
        tenantId: "tenant-lexcorp",
        companyName: "LexCorp",
      },
    });

    // 2. Create Users for Bruce Wayne Corp
    const hmUser1 = await prisma.user.upsert({
      where: { externalId: "hm-bruce-wayne-01" },
      update: {
        role: Role.HIRING_MANAGER,
        tenantId: wayneTenant.tenantId,
      },
      create: {
        id: "usr-hm-001",
        username: "bruce_hm1",
        email: "lucius.fox@waynecorp.com",
        firstName: "Lucius",
        lastName: "Fox",
        department: "R&D",
        role: Role.HIRING_MANAGER,
        tenantId: wayneTenant.tenantId,
        externalId: "hm-bruce-wayne-01",
        provider: AuthProvider.KEYCLOAK,
        profileComplete: true,
      },
    });

    const hmUser2 = await prisma.user.upsert({
      where: { externalId: "hm-bruce-wayne-02" },
      update: {
        role: Role.HIRING_MANAGER,
        tenantId: wayneTenant.tenantId,
      },
      create: {
        id: "usr-hm-002",
        username: "bruce_hm2",
        email: "rachel.dawes@waynecorp.com",
        firstName: "Rachel",
        lastName: "Dawes",
        department: "Legal & Operations",
        role: Role.HIRING_MANAGER,
        tenantId: wayneTenant.tenantId,
        externalId: "hm-bruce-wayne-02",
        provider: AuthProvider.KEYCLOAK,
        profileComplete: true,
      },
    });

    await prisma.user.upsert({
      where: { externalId: "vendor-bruce-01" },
      update: {
        role: Role.IT_VENDOR,
        tenantId: wayneTenant.tenantId,
      },
      create: {
        id: "usr-vendor-001",
        username: "vendor_gotham",
        email: "vendor1@gothamtech.com",
        firstName: "Harvey",
        lastName: "Dent",
        department: "Vendor Staffing",
        role: Role.IT_VENDOR,
        tenantId: wayneTenant.tenantId,
        externalId: "vendor-bruce-01",
        provider: AuthProvider.KEYCLOAK,
        profileComplete: true,
      },
    });

    await prisma.user.upsert({
      where: { externalId: "vendor-bruce-02" },
      update: {
        role: Role.IT_VENDOR,
        tenantId: wayneTenant.tenantId,
      },
      create: {
        id: "usr-vendor-002",
        username: "vendor_arkham",
        email: "vendor2@arkhambytes.com",
        firstName: "Jonathan",
        lastName: "Crane",
        department: "Recruiting",
        role: Role.IT_VENDOR,
        tenantId: wayneTenant.tenantId,
        externalId: "vendor-bruce-02",
        provider: AuthProvider.KEYCLOAK,
        profileComplete: true,
      },
    });

    // Secondary tenant users for testing leakage
    await prisma.user.upsert({
      where: { externalId: "vendor-lex-01" },
      update: {
        role: Role.IT_VENDOR,
        tenantId: lexTenant.tenantId,
      },
      create: {
        id: "usr-vendor-lex",
        username: "vendor_lex",
        email: "recruiter@lexcorp.com",
        firstName: "Mercy",
        lastName: "Graves",
        department: "Talent Acquisition",
        role: Role.IT_VENDOR,
        tenantId: lexTenant.tenantId,
        externalId: "vendor-lex-01",
        provider: AuthProvider.KEYCLOAK,
        profileComplete: true,
      },
    });

    // 3. Define 13 diverse openings for Bruce Wayne Corp
    const openingsData = [
      {
        id: "op-bwc-001",
        tenantId: wayneTenant.tenantId,
        title: "Senior Full Stack TypeScript Engineer",
        description:
          "Seeking an experienced full-stack engineer to build core microservices and web interfaces. Required skills: TypeScript, Node.js, React, PostgreSQL, Docker, AWS.",
        location: "Remote",
        contractType: "C2C",
        hiringManagerId: hmUser1.id,
        experienceMin: 5,
        experienceMax: 8,
        status: OpeningStatus.OPEN,
      },
      {
        id: "op-bwc-002",
        tenantId: wayneTenant.tenantId,
        title: "Lead Cloud Infrastructure Architect",
        description:
          "Architect scalable, secure AWS infrastructure and Kubernetes clusters. Required skills: AWS, Kubernetes, Terraform, Docker, CI/CD, Python.",
        location: "Gotham City",
        contractType: "W2 Contract",
        hiringManagerId: hmUser1.id,
        experienceMin: 8,
        experienceMax: 12,
        status: OpeningStatus.OPEN,
      },
      {
        id: "op-bwc-003",
        tenantId: wayneTenant.tenantId,
        title: "AI / Machine Learning Engineer",
        description:
          "Implement LLM agents and predictive scoring models. Required skills: Python, PyTorch, LangChain, FastApi, Machine Learning, NLP, Docker.",
        location: "Remote",
        contractType: "Contract to Hire",
        hiringManagerId: hmUser1.id,
        experienceMin: 4,
        experienceMax: 7,
        status: OpeningStatus.OPEN,
      },
      {
        id: "op-bwc-004",
        tenantId: wayneTenant.tenantId,
        title: "Senior React Frontend Developer",
        description:
          "Build modern web applications with Next.js, React, and Tailwind CSS. Required skills: React, TypeScript, Next.js, Redux, Tailwind CSS, HTML, CSS.",
        location: "New York, NY",
        contractType: "C2C",
        hiringManagerId: hmUser1.id,
        experienceMin: 4,
        experienceMax: 6,
        status: OpeningStatus.OPEN,
      },
      {
        id: "op-bwc-005",
        tenantId: wayneTenant.tenantId,
        title: "Cybersecurity & DevSecOps Specialist",
        description:
          "Secure cloud workloads, conduct vulnerability assessments, and build SIEM pipelines. Required skills: Cybersecurity, AWS, Python, Linux, OWASP, Docker.",
        location: "Gotham City",
        contractType: "Fixed Term",
        hiringManagerId: hmUser2.id,
        experienceMin: 6,
        experienceMax: 10,
        status: OpeningStatus.OPEN,
      },
      {
        id: "op-bwc-006",
        tenantId: wayneTenant.tenantId,
        title: "Backend Node.js & Microservices Engineer",
        description:
          "Design high-throughput REST and GraphQL APIs. Required skills: Node.js, Express, TypeScript, PostgreSQL, Redis, Kafka, Docker.",
        location: "Remote",
        contractType: "1099",
        hiringManagerId: hmUser1.id,
        experienceMin: 3,
        experienceMax: 6,
        status: OpeningStatus.OPEN,
      },
      {
        id: "op-bwc-007",
        tenantId: wayneTenant.tenantId,
        title: "Data Platform Engineer",
        description:
          "Develop distributed data pipelines and analytics engines. Required skills: Python, Apache Spark, SQL, Snowflake, Airflow, AWS.",
        location: "Remote",
        contractType: "C2C",
        hiringManagerId: hmUser2.id,
        experienceMin: 5,
        experienceMax: 9,
        status: OpeningStatus.OPEN,
      },
      {
        id: "op-bwc-008",
        tenantId: wayneTenant.tenantId,
        title: "Site Reliability Engineer (SRE)",
        description:
          "Ensure 99.99% uptime of mission-critical systems and automate operations. Required skills: Linux, Kubernetes, Prometheus, Grafana, Go, Python, AWS.",
        location: "Gotham City",
        contractType: "W2 Contract",
        hiringManagerId: hmUser1.id,
        experienceMin: 5,
        experienceMax: 8,
        status: OpeningStatus.OPEN,
      },
      {
        id: "op-bwc-009",
        tenantId: wayneTenant.tenantId,
        title: "Mobile Application Developer (React Native)",
        description:
          "Deliver cross-platform mobile apps for iOS and Android. Required skills: React Native, TypeScript, iOS, Android, Redux, REST API.",
        location: "Remote",
        contractType: "Contract to Hire",
        hiringManagerId: hmUser2.id,
        experienceMin: 3,
        experienceMax: 5,
        status: OpeningStatus.OPEN,
      },
      {
        id: "op-bwc-010",
        tenantId: wayneTenant.tenantId,
        title: "QA Automation Lead",
        description:
          "Lead automated end-to-end and API testing suites. Required skills: Playwright, Cypress, JavaScript, Jest, CI/CD, Git, API Testing.",
        location: "Gotham City",
        contractType: "C2C",
        hiringManagerId: hmUser2.id,
        experienceMin: 5,
        experienceMax: 8,
        status: OpeningStatus.OPEN,
      },
      {
        id: "op-bwc-011",
        tenantId: wayneTenant.tenantId,
        title: "Principal Solutions Architect",
        description:
          "Guide technical strategy and enterprise integrations. Required skills: System Design, AWS, Microservices, Enterprise Architecture, Java, Go, Kubernetes.",
        location: "Remote",
        contractType: "W2 Contract",
        hiringManagerId: hmUser1.id,
        experienceMin: 10,
        experienceMax: 15,
        status: OpeningStatus.OPEN,
      },
      {
        id: "op-bwc-012",
        tenantId: wayneTenant.tenantId,
        title: "Database Administrator & Performance Tuning Specialist",
        description:
          "Manage large-scale PostgreSQL and Redis clusters, optimize query plans and indexes. Required skills: PostgreSQL, MySQL, Redis, Performance Tuning, Linux, SQL.",
        location: "Gotham City",
        contractType: "Fixed Term",
        hiringManagerId: hmUser2.id,
        experienceMin: 6,
        experienceMax: 10,
        status: OpeningStatus.OPEN,
      },
      {
        id: "op-bwc-013",
        tenantId: wayneTenant.tenantId,
        title: "Junior Go Backend Developer",
        description:
          "Assist in backend microservices implementation in Golang. Required skills: Go, Docker, REST API, Git, PostgreSQL.",
        location: "Remote",
        contractType: "Contract to Hire",
        hiringManagerId: hmUser1.id,
        experienceMin: 1,
        experienceMax: 3,
        status: OpeningStatus.OPEN,
      },
    ];

    for (const op of openingsData) {
      await prisma.opening.upsert({
        where: { id: op.id },
        update: op,
        create: op,
      });
    }

    // Also seed 1 opening in LexCorp to test cross-tenant leakage prevention
    await prisma.opening.upsert({
      where: { id: "op-lex-001" },
      update: {
        title: "LexCorp Secret Research Scientist",
        tenantId: lexTenant.tenantId,
        hiringManagerId: "usr-vendor-lex",
      },
      create: {
        id: "op-lex-001",
        tenantId: lexTenant.tenantId,
        title: "LexCorp Secret Research Scientist",
        description: "Confidential research position at LexCorp.",
        location: "Metropolis",
        contractType: "C2C",
        hiringManagerId: "usr-vendor-lex",
        experienceMin: 7,
        experienceMax: 12,
        status: OpeningStatus.OPEN,
      },
    });

    console.log("✅ Seed completed successfully!");
    console.log(`- Tenant: ${wayneTenant.companyName} (${wayneTenant.tenantId})`);
    console.log(`- Seeded ${openingsData.length} openings for Bruce Wayne Corp`);
    console.log(`- Seeded 1 isolation opening for LexCorp`);
  } catch (error) {
    console.error("❌ Error seeding openings:", error);
    throw error;
  }
}

// Auto-run if executed directly
seedOpenings()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
