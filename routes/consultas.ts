import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import nodemailer from "nodemailer";
import { verificaToken } from "../middlewares/verificaToken";

const prisma = new PrismaClient({
  log: [
    {
      emit: "event",
      level: "query",
    },
    {
      emit: "stdout",
      level: "error",
    },
    {
      emit: "stdout",
      level: "info",
    },
    {
      emit: "stdout",
      level: "warn",
    },
  ],
});

prisma.$on("query", (e) => {
  console.log("Query: " + e.query);
  console.log("Params: " + e.params);
  console.log("Duration: " + e.duration + "ms");
});

const router = Router();

router.get("/", async (req, res) => {
  try {
    const consultas = await prisma.consulta.findMany({
      include: {
        cliente: true,
        medico: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.status(200).json(consultas);
  } catch (error) {
    res.status(400).json(error);
  }
});

router.post("/", async (req, res) => {
  const { clienteId, medicoId, descricao, dataSolicitada } = req.body;

  if (!clienteId || !medicoId || !descricao || !dataSolicitada) {
    res
      .status(400)
      .json({
        erro: "Informe clienteId, medicoId, dataSolicitada e descricao",
      });
    return;
  }

  try {
    const consulta = await prisma.consulta.create({
      data: { clienteId, medicoId, descricao, dataSolicitada: new Date(dataSolicitada) },
    });
    res.status(201).json(consulta);
  } catch (error) {
    res.status(400).json(error);
  }
});





async function enviaEmail(
  nome: string,
  email: string,
  descricao: string,
  dataSolicitada: Date,
  resposta: string
) {
  const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 587,
    secure: false,
    auth: {
      user: "194ffc000de7d0",
      pass: "158d0efaa4a7db",
    },
    connectionTimeout: 10000, // 10 segundos
    greetingTimeout: 10000, // 10 segundos para saudação
    socketTimeout: 10000, // 10 segundos para a conexão
  });

  try {
    transporter.verify((error, success) => {
      if (error) {
        console.error("SMTP Connection Error:", error);
      } else {
        console.log("SMTP Server is ready to send emails");
      }
    });
  
    const info = await transporter.sendMail({
      from: "caua91@outlook.com", // sender address
      to: email, // list of receivers
      subject: "Re: Req. Consulta Médica", // Subject line
      text: resposta, // plain text body
      html: `<h3>Estimado Cliente: ${nome}</h3>
             <h3>consulta: ${descricao}</h3>
             <h3>Data requisitada: ${dataSolicitada}</h3>
             <h3>Resposta da Revenda: ${resposta}</h3>
             <p>Muito obrigado pelo seu contato</p>
             <p>Consultas Médicas</p>`,
    });
  
    console.log("Message sent: %s", info.messageId);
  } catch (error) {
    console.error("erro enviando o email:", error)
  } finally {
    transporter.close()
  }

  
}



router.patch("/:id", verificaToken, async (req, res) => {
  const { id } = req.params;
  const { resposta, status } = req.body;



  if (!resposta) {
    res.status(400).json({ erro: "Informe a resposta desta consulta" });
    return;
  }



  try {

    const consulta = await prisma.consulta.update({
      where: { id: Number(id) },
      data: { resposta, status }
    });

    const dados = await prisma.consulta.findUnique({
      where: { id: Number(id) },
      include: {
        cliente: true,
      },
    });

    enviaEmail(
      dados?.cliente.nome as string,
      dados?.cliente.email as string,
      dados?.descricao as string,
      dados?.dataSolicitada as Date,
      resposta
    );

    res.status(200).json(consulta);
  } catch (error) {
    res.status(400).json(error);
  }
});


router.get("/:clienteId", async (req, res) => {
  const { clienteId } = req.params;
  try {
    const consultas = await prisma.consulta.findMany({
      where: { clienteId },
      include: {
        medico: true,
      },
    });
    res.status(200).json(consultas);
  } catch (error) {
    res.status(400).json(error);
  }
});



router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const consulta = await prisma.consulta.delete({
      where: { id: Number(id) },
    });
    res.status(200).json(consulta);
  } catch (error) {
    res.status(400).json(error);
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { descricao, dataSolicitada } = req.body;

  if (!descricao || !dataSolicitada) {
    res.status(400).json({ erro: "Informe descricao e a data solicitada" });
    return;
  }

  try {
    const consulta = await prisma.consulta.update({
      where: { id: Number(id) },
      data: { descricao, dataSolicitada: new Date(dataSolicitada) },
    });
    res.status(200).json(consulta);
  } catch (error) {
    res.status(400).json(error);
  }
});

export default router;
