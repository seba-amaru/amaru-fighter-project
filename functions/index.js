const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

// Initialize Firebase Admin
admin.initializeApp();

// Configure Email Transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "amarufighter@gmail.com",
    pass: process.env.EMAIL_PASS || "muiz kcjn xcfr mrvl",
  },
});

/**
 * 1. Automatic Welcome Email
 * Uses Functions v1. Runs on new document creation in /users/{userId}
 */
exports.sendWelcomeEmailOnUserCreate = functions
  .firestore.document("users/{userId}")
  .onCreate(async (snapshot, context) => {
    const newUser = snapshot.data();
    const userEmail = newUser.email || newUser.correo;

    if (!userEmail) {
      console.log(`Missing email for user ${snapshot.id}. Aborting email.`);
      return null;
    }

    const welcomeMailOptions = {
      from: '"Amarufighter Academy" <noreply@amarufighter.com>',
      to: userEmail,
      subject: "⛩️ ¡Bienvenido a la Familia Amarufighter!",
      html: `
        <h2>¡Hola ${newUser.name || newUser.nombre || "Guerrero"}!</h2>
        <p>Nos emociona mucho darte la bienvenida a <strong>Amarufighter</strong>.</p>
        <p>A partir de este momento, eres parte de nuestra familia. Ya puedes ingresar a la plataforma, revisar tu perfil y comenzar a familiarizarte con nuestras disciplinas.</p>
        <p>Preparate para sacar tu mejor versión.</p>
        <br>
        <p>— <b>Sensei Amaru</b> (La Familia Nunca Muere)</p>
      `,
    };

    try {
      await transporter.sendMail(welcomeMailOptions);
      console.log(`Successfully sent welcome email to: ${userEmail}`);
    } catch (error) {
      console.error(`Error sending welcome email to ${userEmail}:`, error);
    }
    return null;
  });

/**
 * 2. Automatic Notification upon explicit Subscription/Membership changes
 * Uses Functions v1. Runs on document update in /users/{userId}
 */
exports.sendMembershipUpdateEmail = functions
  .firestore.document("users/{userId}")
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();

    const userEmail = afterData.email || afterData.correo;
    if (!userEmail) return null;

    const oldStatus = beforeData.membershipStatus || beforeData.estadoSuscripcion || "none";
    const newStatus = afterData.membershipStatus || afterData.estadoSuscripcion || "none";

    // Detect expiration (example mapping string to "vencido")
    if (oldStatus !== newStatus && newStatus === "vencido") {
      const reminderMailOptions = {
        from: '"Amarufighter Academy" <pagos@amarufighter.com>',
        to: userEmail,
        subject: "⚠️ Aviso: Vencimiento de tu Membresía",
        html: `
          <h2>¡Hola ${afterData.name || afterData.nombre || "Guerrero"}!</h2>
          <p>Esperamos que tus entrenamientos estén yendo de maravilla.</p>
          <p>Este es un recordatorio automático para informarte que el período de tu suscripción actual ha finalizado o está a punto de vencer.</p>
          <p>Para no perder tu progreso, por favor ingresa a tu <a href="https://amarufighter.web.app/app/index.html">panel de control en la App</a> y renueva tu mensualidad para continuar forjando disciplina.</p>
          <p>Si ya realizaste el pago, ignora este correo; nuestros administradores lo actualizarán en breve.</p>
          <br>
          <p>OSS 🥋</p>
        `,
      };

      try {
        await transporter.sendMail(reminderMailOptions);
        console.log(`Successfully sent payment reminder to: ${userEmail}`);
      } catch (error) {
        console.error(`Error sending payment reminder to ${userEmail}:`, error);
      }
    }
    return null;
  });

/**
 * 3. Daily Pro-Rata Payment Reminders
 * Runs every day at 10:00 AM (local time depends on config).
 * Reminds 'pending' users who chose proportional payment that the month is ending.
 */
exports.dailyProRataReminders = functions.pubsub
  .schedule("every 24 hours")
  .onRun(async (context) => {
    const usersSnapshot = await admin.firestore().collection("users")
      .where("membership_status", "==", "pending")
      .where("proRataPreference", "==", "proportional")
      .get();

    console.log(`Processing ${usersSnapshot.size} pending pro-rata users.`);

    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysLeft = daysInMonth - now.getDate() + 1;

    const emailPromises = usersSnapshot.docs.map(async (doc) => {
      const userData = doc.data();
      const userEmail = userData.email || userData.correo;
      if (!userEmail) return null;

      // Check if preference is from current month
      const now = new Date();
      const currentMonthYear = `${now.getMonth()}-${now.getFullYear()}`;
      if (userData.proRataMonthYear !== currentMonthYear) {
        console.log(`Skipping reminder for ${userEmail}: choice from a previous month.`);
        return null;
      }

      const mailOptions = {
        from: '"Amarufighter Academy" <pagos@amarufighter.com>',
        to: userEmail,
        subject: "🥋 ¡No pierdas tu inscripción proporcional!",
        html: `
          <h2>¡Hola ${userData.name || userData.nombre || "Guerrero"}!</h2>
          <p>Notamos que elegiste la <b>inscripción proporcional</b> para unirte a Amarufighter este mes.</p>
          <p>Te recordamos que solo te quedan <strong>${daysLeft} días</strong> para aprovechar este beneficio antes de que termine el mes.</p>
          <p>Si el mes finaliza sin que se haya procesado el pago, el sistema renovará la oferta al precio estándar de mes completo para el próximo periodo.</p>
          <p>¡No dejes pasar más tiempo y ven a entrenar!</p>
          <br>
          <p><a href="https://amarufighter.web.app/app/index.html" style="background:#8b5cf6; color:white; padding:10px 20px; text-decoration:none; border-radius:5px; font-weight:bold;">COMPLETAR MI INSCRIPCIÓN</a></p>
          <br>
          <p>OSS 🥋</p>
        `,
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log(`Reminder sent to: ${userEmail}`);
      } catch (e) {
        console.error(`Error sending reminder to ${userEmail}:`, e);
      }
    });

    await Promise.all(emailPromises);
    return null;
  });

/**
 * 4. Monthly Pro-Rata Cleanup
 * Runs on the 1st of every month at midnight.
 * Resets pro-rata preferences that weren't paid, forcing full price for the new month.
 */
exports.monthlyProRataCleanup = functions.pubsub
  .schedule("0 0 1 * *")
  .onRun(async (context) => {
    const usersSnapshot = await admin.firestore().collection("users")
      .where("membership_status", "==", "pending")
      .where("proRataPreference", "in", ["proportional", "full"])
      .get();

    console.log(`Starting cleanup for ${usersSnapshot.size} pending preferences at start of month.`);

    const now = new Date();
    const currentMonthYear = `${now.getMonth()}-${now.getFullYear()}`;
    const batch = admin.firestore().batch();
    
    usersSnapshot.docs.forEach(doc => {
      const data = doc.data();
      // If the preference was for any previous month, we reset it
      if (data.proRataMonthYear !== currentMonthYear) {
        batch.update(doc.ref, {
          proRataPreference: null,
          proRataMonthYear: null,
          proRataExpiredInMonth: true // Flag to show a message in the app UI
        });
      }
    });

    await batch.commit();
    console.log("Cleanup batch committed.");
    return null;
  });
