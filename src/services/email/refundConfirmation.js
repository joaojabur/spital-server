const sendMail = require("./core");

module.exports = async function refundConfirmation({
  name,
  email,
  callback,
  medic,
  appointment,
  location,
}) {
  const [month, day, year] = appointment.date.split("/");
  let to = email;
  let subject = "Consulta cancelada 😪";
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
      <title>Spital - Consulta agendada</title>
    </head>
    <body
      style="
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        font-family: Quicksand;
      "
    >
      <table width="600" align="center" cellpadding="0" cellspacing="0">
        <tr>
          <td
            style="
              padding: 15px 0 15px 0;
              color: white;
              font-size: 30px;
              font-weight: bold;
            "
            bgcolor="#24daff"
            align="center"
          >
            <a
              style="text-decoration: none; color: #fff"
              href="http://localhost:3000"
              >Spital</a
            >
          </td>
        </tr>
        <tr>
          <td style="padding: 20px 20px 20px 20px; font-size: 26px">
            <img
              style="width: 50px; height: 50px; border-radius: 50%"
              src="https://avatars.dicebear.com/api/human/${
                medic.first_name + medic.last_name
              }.svg"
            />
            <span style="font-size: 20px; position: relative; top: -15px">
                Consulta com 
                <span style="color: #07b3d6; font-weight: bold">
                  ${medic.first_name} ${medic.last_name}
                </span>
                <span style="color: #f00; font-weight: bold">cancelada</span>
              </span
            >
          </td>
        </tr>
  
        <tr>
          <td
            style="
              width: 70%;
              height: 1px;
              background-color: #ccc;
              margin: 20px auto 0 auto;
            "
          ></td>
        </tr>
  
        <tr style="margin-top: 20px">
          <td style="padding: 20px 20px 20px 20px; font-size: 18px">
            <img
              src="https://cdn.discordapp.com/attachments/833874352679813181/848201170966806528/outline_event_busy_black_24dp.png"
            />
            <span style="position: relative; top: -15px; font-weight: bold; color: #f00"
              >Consulta dia ${day}/${month}/${year} às ${appointment.time}</span
            >
          </td>
        </tr>
        <tr>
          <td style="padding: 20px 20px 20px 20px; font-size: 18px">
            <img
              src="https://cdn.discordapp.com/attachments/833874352679813181/848205629234741278/outline_location_off_black_24dp.png"
            />
            <span style="position: relative; top: -15px; font-weight: bold; color: #f00"
              >${location.address} ${location.number}</span
            >
          </td>
        </tr>
  
        <tr align="center">
          <td>
            <a
              href="http://localhost:3000/consultas"
              style="
                margin: 20px auto 0 auto;
                background-color: #07b3d6;
                color: #fff;
                display: block;
                width: 500px;
                height: 30px;
                font-size: 20px;
                padding: 10px;
                border-radius: 30px;
                text-decoration: none;
                font-weight: bold;
              "
              >Ver na plataforma</a
            >
          </td>
        </tr>
      </table>
    </body>
  </html>
    `;

  await sendMail({
    to,
    subject,
    html,
    callback,
  });
};
