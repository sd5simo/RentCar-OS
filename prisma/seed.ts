import { PrismaClient } from "@prisma/client";
import { addDays, subDays, subMonths } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Wiping the database for a clean mega-seed...");
  
  // 1. Clean up in exact relational order
  await prisma.expense.deleteMany();
  await prisma.damageLog.deleteMany();
  await prisma.infraction.deleteMany();
  await prisma.rental.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.client.deleteMany();

  console.log("🌱 Seeding RentCar-OS with Maximum Potential (12+ Cars)...");

  // ---------------------------------------------------------
  // 1. CLIENTS (15 varied profiles: VIP, Blacklisted, Corporate, Regulars)
  // ---------------------------------------------------------
  const clientsData = [
    { cin: "AB111111", firstName: "Youssef", lastName: "Benali", city: "Casablanca", phone: "0661111111", email: "youssef@email.ma" },
    { cin: "CD222222", firstName: "Fatima", lastName: "Idrissi", city: "Rabat", phone: "0662222222", email: "fatima@email.ma" },
    { cin: "EF333333", firstName: "Omar", lastName: "Tazi", city: "Marrakech", phone: "0663333333", isBlacklist: true, blacklistReason: "Accident sous l'emprise de l'alcool", blacklistedAt: subDays(new Date(), 45) },
    { cin: "GH444444", firstName: "Aicha", lastName: "Slaoui", city: "Fès", phone: "0664444444" },
    { cin: "IJ555555", firstName: "Karim", lastName: "Hajji", city: "Agadir", phone: "0665555555", email: "karim@email.ma" },
    { cin: "KL666666", firstName: "Sara", lastName: "Amrani", city: "Tanger", phone: "0666666666", notes: "👑 VIP - Toujours surclasser - Directrice Générale" },
    { cin: "MN777777", firstName: "Mehdi", lastName: "Chraibi", city: "Casablanca", phone: "0667777777" },
    { cin: "OP888888", firstName: "Nawal", lastName: "Berrada", city: "Rabat", phone: "0668888888" },
    { cin: "QR999999", firstName: "Hassan", lastName: "Mekouar", city: "Marrakech", phone: "0669999999" },
    { cin: "ST000000", firstName: "Leila", lastName: "Zidane", city: "Tanger", phone: "0660000000", notes: "Client Corporate - Facturation fin de mois" },
    { cin: "UV121212", firstName: "Brahim", lastName: "Nassiri", city: "Agadir", phone: "0661212121" },
    { cin: "WX343434", firstName: "Kawtar", lastName: "Lahlou", city: "Fès", phone: "0663434343" },
    { cin: "YZ565656", firstName: "Tarik", lastName: "El Fassi", city: "Casablanca", phone: "0665656565", isBlacklist: true, blacklistReason: "Non-paiement répété", blacklistedAt: subDays(new Date(), 120) },
    { cin: "AA787878", firstName: "Imane", lastName: "Kabbaj", city: "Rabat", phone: "0667878787" },
    { cin: "BB909090", firstName: "Yassine", lastName: "Bennis", city: "Tanger", phone: "0669090909" },
  ];

  const clients = await Promise.all(clientsData.map(data => prisma.client.create({ data })));

  // ---------------------------------------------------------
  // 2. VEHICLES (12 Cars: Economy to Luxury + Vans + Hybrids)
  // ---------------------------------------------------------
  const vehiclesData = [
    // ECONOMY
    { plate: "11111-A-6", brand: "Dacia", model: "Logan", year: 2023, category: "ECONOMY", color: "Blanc", fuelType: "DIESEL", transmission: "MANUAL", dailyRate: 250, status: "AVAILABLE", mileage: 45000 },
    { plate: "22222-B-6", brand: "Renault", model: "Clio 5", year: 2023, category: "ECONOMY", color: "Rouge", fuelType: "ESSENCE", transmission: "MANUAL", dailyRate: 300, status: "RENTED", mileage: 22000 },
    { plate: "33333-C-6", brand: "Peugeot", model: "208", year: 2024, category: "ECONOMY", color: "Gris", fuelType: "DIESEL", transmission: "MANUAL", dailyRate: 320, status: "AVAILABLE", mileage: 15000 },
    { plate: "44444-D-6", brand: "Fiat", model: "500", year: 2022, category: "ECONOMY", color: "Blanc", fuelType: "ESSENCE", transmission: "AUTOMATIC", dailyRate: 350, status: "MAINTENANCE", mileage: 55000 },
    
    // COMFORT & SUV
    { plate: "55555-E-6", brand: "Volkswagen", model: "Golf 8", year: 2024, category: "COMFORT", color: "Noir", fuelType: "DIESEL", transmission: "AUTOMATIC", dailyRate: 500, status: "RENTED", mileage: 8000 },
    { plate: "66666-F-6", brand: "Hyundai", model: "Tucson", year: 2023, category: "SUV", color: "Gris", fuelType: "DIESEL", transmission: "AUTOMATIC", dailyRate: 650, status: "AVAILABLE", mileage: 30000 },
    { plate: "77777-G-6", brand: "Toyota", model: "RAV4", year: 2024, category: "SUV", color: "Blanc", fuelType: "HYBRID", transmission: "AUTOMATIC", dailyRate: 750, status: "RENTED", mileage: 12000 },
    
    // LUXURY
    { plate: "88888-H-6", brand: "Mercedes", model: "Class C", year: 2023, category: "LUXURY", color: "Noir", fuelType: "DIESEL", transmission: "AUTOMATIC", dailyRate: 1200, status: "AVAILABLE", mileage: 25000 },
    { plate: "99999-I-6", brand: "BMW", model: "Série 5", year: 2024, category: "LUXURY", color: "Gris Nardo", fuelType: "HYBRID", transmission: "AUTOMATIC", dailyRate: 1400, status: "RENTED", mileage: 5000 },
    { plate: "10101-J-6", brand: "Range Rover", model: "Evoque", year: 2022, category: "LUXURY", color: "Blanc", fuelType: "DIESEL", transmission: "AUTOMATIC", dailyRate: 1500, status: "MAINTENANCE", mileage: 48000 },
    { plate: "12121-K-6", brand: "Audi", model: "Q8", year: 2024, category: "LUXURY", color: "Noir", fuelType: "DIESEL", transmission: "AUTOMATIC", dailyRate: 2000, status: "AVAILABLE", mileage: 10000 },

    // VAN / UTILITY
    { plate: "13131-L-6", brand: "Renault", model: "Trafic Passenger", year: 2021, category: "VAN", color: "Blanc", fuelType: "DIESEL", transmission: "MANUAL", seats: 9, dailyRate: 600, status: "RENTED", mileage: 110000 },
  ];

  const vehicles = await Promise.all(
    vehiclesData.map(data => prisma.vehicle.create({ 
      data: {
        ...data,
        lastOilChangeMileage: data.mileage - Math.floor(Math.random() * 8000),
        nextOilChangeMileage: data.mileage + 2000, // Close to oil change to trigger alerts
        technicalInspectionDate: addDays(new Date(), Math.floor(Math.random() * 300)),
        insuranceExpiry: addDays(new Date(), Math.floor(Math.random() * 60) + 5), // Some close to expiry
        vignetteExpiry: addDays(new Date(), 200),
      }
    }))
  );

  // ---------------------------------------------------------
  // 3. RESERVATIONS (The Pipeline)
  // ---------------------------------------------------------
  await Promise.all([
    // Future Confirmed
    prisma.reservation.create({
      data: { refCode: "RES-2024-001", clientId: clients[5].id, vehicleId: vehicles[7].id, startDate: addDays(new Date(), 2), endDate: addDays(new Date(), 5), totalAmount: 3600, status: "CONFIRMED", notes: "VIP: Déposer le véhicule à l'aéroport" }
    }),
    prisma.reservation.create({
      data: { refCode: "RES-2024-002", clientId: clients[9].id, vehicleId: vehicles[6].id, startDate: addDays(new Date(), 7), endDate: addDays(new Date(), 20), totalAmount: 9750, status: "CONFIRMED" }
    }),
    // Pending
    prisma.reservation.create({
      data: { refCode: "RES-2024-003", clientId: clients[14].id, vehicleId: vehicles[2].id, startDate: addDays(new Date(), 10), endDate: addDays(new Date(), 15), totalAmount: 1600, status: "PENDING" }
    }),
    // Cancelled
    prisma.reservation.create({
      data: { refCode: "RES-2024-004", clientId: clients[11].id, vehicleId: vehicles[10].id, startDate: subDays(new Date(), 2), endDate: addDays(new Date(), 2), totalAmount: 8000, status: "CANCELLED", notes: "Vol annulé" }
    }),
  ]);

  // ---------------------------------------------------------
  // 4. ACTIVE & OVERDUE RENTALS
  // ---------------------------------------------------------
  await Promise.all([
    // Normal Active
    prisma.rental.create({
      data: { contractNum: "CTR-ACT-01", clientId: clients[0].id, vehicleId: vehicles[1].id, startDate: subDays(new Date(), 3), endDate: addDays(new Date(), 4), dailyRate: 300, totalDays: 7, totalAmount: 2100, paidAmount: 1000, deposit: 3000, fuelLevelStart: "FULL", mileageStart: 21800, status: "ACTIVE" }
    }),
    prisma.rental.create({
      data: { contractNum: "CTR-ACT-02", clientId: clients[1].id, vehicleId: vehicles[4].id, startDate: subDays(new Date(), 1), endDate: addDays(new Date(), 2), dailyRate: 500, totalDays: 3, totalAmount: 1500, paidAmount: 1500, deposit: 5000, fuelLevelStart: "3/4", mileageStart: 7850, status: "ACTIVE" }
    }),
    prisma.rental.create({
      data: { contractNum: "CTR-ACT-03", clientId: clients[6].id, vehicleId: vehicles[8].id, startDate: subDays(new Date(), 5), endDate: addDays(new Date(), 5), dailyRate: 1400, totalDays: 10, totalAmount: 14000, paidAmount: 14000, deposit: 10000, fuelLevelStart: "FULL", mileageStart: 4500, status: "ACTIVE" }
    }),
    
    // OVERDUE RENTALS (Will light up the dashboard alerts)
    prisma.rental.create({
      data: { contractNum: "CTR-OVR-01", clientId: clients[3].id, vehicleId: vehicles[11].id, startDate: subDays(new Date(), 10), endDate: subDays(new Date(), 2), dailyRate: 600, totalDays: 8, totalAmount: 4800, paidAmount: 4800, deposit: 5000, fuelLevelStart: "1/2", mileageStart: 109000, status: "ACTIVE", notes: "⚠️ RETARD CRITIQUE - Client injoignable" }
    }),
    prisma.rental.create({
      data: { contractNum: "CTR-OVR-02", clientId: clients[7].id, vehicleId: vehicles[6].id, startDate: subDays(new Date(), 7), endDate: subDays(new Date(), 1), dailyRate: 750, totalDays: 6, totalAmount: 4500, paidAmount: 2000, deposit: 8000, fuelLevelStart: "FULL", mileageStart: 11500, status: "ACTIVE", notes: "Retard d'un jour, a prévenu par téléphone" }
    }),
  ]);

  // ---------------------------------------------------------
  // 5. HISTORICAL RENTALS (Massive data for Revenue Charts)
  // ---------------------------------------------------------
  const historicalRentals = [];
  let contractCounter = 1;

  for (let month = 0; month < 8; month++) { // 8 months of deep history
    const baseDate = subMonths(new Date(), month);
    const rentalsThisMonth = Math.floor(Math.random() * 8) + 7; // 7 to 15 rentals per month
    
    for (let i = 0; i < rentalsThisMonth; i++) {
      const v = vehicles[Math.floor(Math.random() * vehicles.length)];
      const c = clients[Math.floor(Math.random() * clients.length)];
      const days = Math.floor(Math.random() * 10) + 1; // 1 to 10 days
      const amount = v.dailyRate * days;

      historicalRentals.push({
        contractNum: `CTR-HIST-${String(contractCounter++).padStart(4, '0')}`,
        clientId: c.id,
        vehicleId: v.id,
        startDate: subDays(baseDate, i * 2 + days),
        endDate: subDays(baseDate, i * 2),
        returnDate: subDays(baseDate, i * 2),
        dailyRate: v.dailyRate,
        totalDays: days,
        totalAmount: amount,
        paidAmount: amount,
        deposit: 3000,
        depositReturned: true,
        fuelLevelStart: "FULL",
        fuelLevelEnd: ["FULL", "3/4", "1/2", "1/4", "EMPTY"][Math.floor(Math.random() * 5)],
        mileageStart: v.mileage - (month * 1500) - 800,
        mileageEnd: v.mileage - (month * 1500),
        status: "COMPLETED",
      });
    }
  }
  await prisma.rental.createMany({ data: historicalRentals });

  // ---------------------------------------------------------
  // 6. EXPENSES (Maintenance, Insurance, Repairs, Cleaning)
  // ---------------------------------------------------------
  await prisma.expense.createMany({
    data: [
      { vehicleId: vehicles[0].id, category: "MAINTENANCE", description: "Vidange complète + 4 filtres", amount: 650, date: subDays(new Date(), 12), vendor: "AutoFix Center" },
      { vehicleId: vehicles[3].id, category: "REPAIR", description: "Changement courroie de distribution", amount: 3500, date: subDays(new Date(), 5), vendor: "Garage Fiat Casa" },
      { vehicleId: vehicles[9].id, category: "REPAIR", description: "Suspension pneumatique", amount: 12000, date: subDays(new Date(), 2), vendor: "SMEIA Range Rover" }, // This is why it's in maintenance
      { category: "INSURANCE", description: "Assurance Flotte Totale (Annuelle)", amount: 85000, date: subMonths(new Date(), 1), vendor: "Wafa Assurance" },
      { category: "MARKETING", description: "Campagne Facebook Ads", amount: 2000, date: subDays(new Date(), 15), vendor: "Meta" },
      { vehicleId: vehicles[10].id, category: "CLEANING", description: "Lavage VIP complet", amount: 250, date: subDays(new Date(), 1) },
      { vehicleId: vehicles[5].id, category: "MAINTENANCE", description: "Changement 4 pneus Michelin", amount: 4800, date: subMonths(new Date(), 2), vendor: "Pneus Express" },
    ]
  });

  // ---------------------------------------------------------
  // 7. DAMAGE LOGS (The good, the bad, and the ugly)
  // ---------------------------------------------------------
  await prisma.damageLog.createMany({
    data: [
      // Unrepaired
      { vehicleId: vehicles[3].id, description: "Pare-chocs avant fissuré", severity: "HIGH", zone: "FRONT", repaired: false, reportedAt: subDays(new Date(), 5) },
      { vehicleId: vehicles[9].id, description: "Jante arrière droite rayée", severity: "MODERATE", zone: "RIGHT", repaired: false, reportedAt: subDays(new Date(), 2) },
      { vehicleId: vehicles[1].id, description: "Brûlure de cigarette siège conducteur", severity: "MINOR", zone: "INTERIOR", repaired: false, reportedAt: subDays(new Date(), 15) },
      // Repaired
      { vehicleId: vehicles[0].id, description: "Rétroviseur gauche cassé", severity: "MODERATE", zone: "LEFT", repaired: true, cost: 1200, repairedAt: subDays(new Date(), 20), reportedAt: subDays(new Date(), 25) },
      { vehicleId: vehicles[7].id, description: "Rayure portière avec clé", severity: "MINOR", zone: "RIGHT", repaired: true, cost: 800, repairedAt: subMonths(new Date(), 1), reportedAt: subMonths(new Date(), 1) },
    ]
  });

  // ---------------------------------------------------------
  // 8. INFRACTIONS (Tickets and Customer Penalties)
  // ---------------------------------------------------------
  await prisma.infraction.createMany({
    data: [
      { clientId: clients[2].id, type: "DAMAGE", description: "Accident responsable - Franchise retenue", amount: 10000, date: subDays(new Date(), 45), resolved: true }, // The reason he is blacklisted
      { clientId: clients[12].id, type: "LATE_RETURN", description: "Non retour et non paiement", amount: 5000, date: subDays(new Date(), 120), resolved: false }, // The other blacklisted client
      { clientId: clients[4].id, type: "TRAFFIC_TICKET", description: "Radar fixe Autoroute A3 (140km/h)", amount: 300, date: subDays(new Date(), 10), resolved: true },
      { clientId: clients[8].id, type: "TRAFFIC_TICKET", description: "Stationnement interdit (Sabot)", amount: 150, date: subDays(new Date(), 2), resolved: false },
      { clientId: clients[1].id, type: "CLEANING", description: "Retour véhicule extrêmement sale (Sable/Poils)", amount: 500, date: subMonths(new Date(), 1), resolved: true },
    ]
  });

  console.log("✅ BOOM! Database fully pumped up and ready!");
  console.log(`   🧍 ${clientsData.length} Clients (2 Blacklisted, 1 VIP, 1 Corporate)`);
  console.log(`   🚗 ${vehiclesData.length} Vehicles (Economy to Luxury SUVs)`);
  console.log(`   📅 4 Pipeline Reservations`);
  console.log(`   🚨 2 Overdue Rentals, 3 Active Rentals`);
  console.log(`   📈 ~90 Historical Rentals for crazy beautiful charts`);
  console.log(`   💰 7 Expenses, 5 Damage logs, 5 Infractions`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });