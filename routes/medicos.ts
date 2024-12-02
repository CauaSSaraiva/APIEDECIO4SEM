import { PrismaClient } from "@prisma/client";
import { Router } from "express";
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
    const medicos = await prisma.medico.findMany({
      include: {
        especialidade: true,
      },
      // where: {
      //   disponivel: true
      // }
    });
    res.status(200).json(medicos);
  } catch (error) {
    res.status(400).json(error);
  }
});

router.get("/disponiveis", async (req, res) => {
  try {
    const carros = await prisma.medico.findMany({
      orderBy: { id: "desc" },
      include: {
        especialidade: true,
      },
      where: { disponivel: true },
    });
    res.status(200).json(carros);
  } catch (error) {
    res.status(400).json(error);
  }
});

router.post("/", verificaToken, async (req, res) => {
  const { nome, idade, preco, foto, email, especialidadeId } = req.body;

  if (!nome || !idade || !preco || !foto || !email || !especialidadeId) {
    res
      .status(400)
      .json({
        erro: "Informe nome, idade, preco, foto, email e especialidadeId",
      });
    return;
  }

  try {
    const medico = await prisma.medico.create({
      data: { nome, idade, preco, foto, email, especialidadeId },
    });
    res.status(201).json(medico);
  } catch (error) {
    res.status(400).json(error);
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const medico = await prisma.medico.delete({
      where: { id: Number(id) },
    });
    res.status(200).json(medico);
  } catch (error) {
    res.status(400).json(error);
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { nome, idade, preco, foto, email, especialidadeId } = req.body;

  if (!nome || !idade || !preco || !foto || !email || !especialidadeId) {
    res
      .status(400)
      .json({
        erro: "Informe nome, idade, preco, foto, email e especialidadeId",
      });
    return;
  }

  try {
    const medico = await prisma.medico.update({
      where: { id: Number(id) },
      data: { nome, idade, preco, foto, email, especialidadeId },
    });
    res.status(200).json(medico);
  } catch (error) {
    res.status(400).json(error);
  }
});

router.get("/pesquisa/:termo", async (req, res) => {
  const { termo } = req.params;
  // tenta converter o termo em número
  const termoNumero = Number(termo);

  // se não é numero (Not a Number)
  if (isNaN(termoNumero)) {
    try {
      const medicos = await prisma.medico.findMany({
        include: {
          especialidade: true,
        },
        where: {
          OR: [
            {
              nome: { contains: termo },
            },
            {
              //poderia ser {nome: {contains:termo}}
              especialidade: { descricao: termo },
            },
          ],
        },
      });
      res.status(200).json(medicos);
    } catch (error) {
      res.status(400).json(error);
    }
  } else {
    try {
      const medicos = await prisma.medico.findMany({
        include: {
          especialidade: true,
        },
        where: {
          OR: [
            {
              preco: { lte: termoNumero },
            },
            {
              //poderia ser {nome: {contains:termo}}
              idade: termoNumero,
            },
          ],
        },
      });
      res.status(200).json(medicos);
    } catch (error) {
      res.status(400).json(error);
    }
  }
});

router.get("/:medico_id", async (req, res) => {
  const { medico_id } = req.params;
  try {
    const medicos = await prisma.medico.findUnique({
      include: {
        especialidade: true,
      },
      where: { id: Number(medico_id) },
    });
    res.status(200).json(medicos);
  } catch (error) {
    res.status(400).json(error);
  }
});

router.put("/disponibilizar/:id", verificaToken, async (req, res) => {
  const { id } = req.params;

  try {
    const medicoDisponibilizar = await prisma.medico.findUnique({
      where: { id: Number(id) },
      select: { disponivel: true },
    });

    const medico = await prisma.medico.update({
      where: { id: Number(id) },
      data: { disponivel: !medicoDisponibilizar?.disponivel },
    });
    res.status(200).json(medico);
  } catch (error) {
    res.status(400).json(error);
  }
});

export default router;
