// src/app/api/send-document/route.ts
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialisation avec votre clé API (à mettre dans le .env)
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email, clientName, documentUrl, documentType, refCode } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "L'email du client est manquant" }, { status: 400 });
    }

    const data = await resend.emails.send({
      // Si vous n'avez pas encore de nom de domaine vérifié sur Resend, 
      // utilisez l'adresse de test fournie par Resend : 'onboarding@resend.dev'
      from: 'Rentify OS <onboarding@resend.dev>', 
      to: [email],
      subject: `Votre ${documentType} - Rentify OS (Réf: ${refCode})`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 10px;">
          <h2 style="color: #1a1a1a;">Bonjour ${clientName},</h2>
          <p style="color: #4a4a4a; line-height: 1.5;">
            Veuillez trouver ci-joint votre <strong>${documentType}</strong> (Référence: ${refCode}) concernant votre location de véhicule.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${documentUrl}" target="_blank" style="display: inline-block; padding: 12px 24px; background-color: #16a34a; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Consulter / Télécharger le document
            </a>
          </div>
          <p style="color: #4a4a4a; font-size: 14px;">Merci pour votre confiance !<br/>L'équipe Rentify OS</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Erreur d'envoi d'email :", error);
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}