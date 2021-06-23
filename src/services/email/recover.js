const sendMail = require("./core");;
const generateForgetPassToken = require("../../middlewares/generateForgetPassToken");

module.exports = async function recoverEmail({ id, name, email, callback }) {
  const token = generateForgetPassToken(id);
  const link = `http://localhost:3000/recuperar/${token}`;

  let to = email;
  let subject = "Recuperação de Senha";
  let html = `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="preconnect" href="https://fonts.gstatic.com" />
      <link
        href="https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;700&display=swap"
        rel="stylesheet"
      />
      <title>Spital Recuperação de Senha</title>
    </head>
    <body style="margin: 0; padding: 0; box-sizing: border-box; font-family: Quicksand;">
      <table width="600" align="center" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 15px 0 15px 0; color: white; font-size: 30px; font-weight: bold;" bgcolor="#24daff" align="center">
            <a style="text-decoration: none; color: #fff;" href="http://localhost:3000">Spital</a>
          </td>
        </tr>
        <tr>
          <td style="padding: 20px 20px 20px 20px; font-size: 26px;">Olá <b>${name}<b>!</td>
        </tr>
        <tr>
          <td style="padding: 0px 20px 5px 20px; font-size: 26px;">
            Vimos aqui que você fez um pedido de recuperação de senha!
          </td>
        </tr>
        <tr>
          <td style="padding: 0px 20px 20px 20px; font-size: 24px; font-weight: 100;">
            Para realizar a recuperação de senha é necessário que clique no botão <span style="color: #3EB713;">"Recuperar senha".</span>
          </td>
        </tr>

        <tr>
          <td style="padding: 0px 20px 20px 20px; font-size: 24px; font-weight: bold; color: #8F2D56; text-transform: uppercase;">
            Caso não tenha sido você: 
          </td>
        </tr>

        <tr>
          <td style="padding: 0px 20px 5px 20px; font-size: 22px;">
            Sua conta de e-mail <span style="color: #f00;">pode estar comprometida</span>!
          </td>
        </tr>

        <tr align="center">
          <td>
          <a href="${link}" style="margin: 20px auto 0 auto; background-color: #3EB713; color: #fff; display: block; width: 200px; height: 50px; font-size: 20px; padding-top: 20px; border-radius: 30px; text-decoration: none;">Recuperar Senha</a>
          </td>
        </tr>
      </table>
    </body>
  </html>
    `;

  return await sendMail({
    to,
    subject,
    html,
    callback,
  });
};
