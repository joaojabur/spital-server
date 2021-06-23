const sendMail = require("./core");;

module.exports = async function notifyRecoverEmail({ name, email, callback }) {
  let to = email;
  let subject = "Senha Atualizada";
  let html = `
        Olá ${name} Sua Senha foi atualizada
    `;

  await sendMail({
    to,
    subject,
    html,
    callback,
  });
};
