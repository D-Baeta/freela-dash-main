import emailjs from "emailjs-com";

export async function sendEmail({ name, email, profession, reason }) {
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  const templateParams = {
    name,
    email,
    profession,
    reason,
  };

  return emailjs.send(serviceId, templateId, templateParams, publicKey);
}
