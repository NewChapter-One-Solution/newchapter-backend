// import cron from 'node-cron';

// cron.schedule("0 23 * * *", async () => {
//     const today = new Date();
//     const weekday = today.getDay();
//     const startOfDay = new Date(today.setHours(0, 0, 0, 0));

//     const users = await prisma.user.findMany({
//         where: { role: "STAFF" },
//         include: { shop: true },
//     });

//     for (const user of users) {
//         const isWeekend = await prisma.weeklyOff.findFirst({
//             where: { shopId: user.shopId!, weekday },
//         });

//         const attendance = await prisma.attendance.findFirst({
//             where: {
//                 userId: user.id,
//                 date: { gte: startOfDay },
//             },
//         });

//         if (!attendance) {
//             await prisma.attendance.create({
//                 data: {
//                     userId: user.id,
//                     date: new Date(),
//                     status: isWeekend ? "WEEKEND" : "ABSENT",
//                 },
//             });
//         }
//     }
// });



// import cron from "node-cron";

// cron.schedule("0 20 * * *", async () => {
//     const today = new Date();
//     const startOfDay = new Date(today.setHours(0, 0, 0, 0));

//     const unchecked = await prisma.attendance.findMany({
//         where: {
//             checkIn: { not: null },
//             checkOut: null,
//             date: { gte: startOfDay }
//         },
//     });

//     for (const record of unchecked) {
//         const checkOut = new Date("2025-06-29T20:00:00.000Z");
//         const workedHours = (checkOut.getTime() - new Date(record.checkIn).getTime()) / (1000 * 60 * 60);

//         await prisma.attendance.update({
//             where: { id: record.id },
//             data: {
//                 checkOut,
//                 workedHours: parseFloat(workedHours.toFixed(2)),
//             },
//         });
//     }
// });
