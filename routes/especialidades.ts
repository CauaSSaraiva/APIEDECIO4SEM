import { PrismaClient } from "@prisma/client"
import { Router } from "express"

const prisma = new PrismaClient()
// const prisma = new PrismaClient({
//   log: [
//     {
//       emit: 'event',
//       level: 'query',
//     },
//     {
//       emit: 'stdout',
//       level: 'error',
//     },
//     {
//       emit: 'stdout',
//       level: 'info',
//     },
//     {
//       emit: 'stdout',
//       level: 'warn',
//     },
//   ],
// })

// prisma.$on('query', (e) => {
//   console.log('Query: ' + e.query)
//   console.log('Params: ' + e.params)
//   console.log('Duration: ' + e.duration + 'ms')
// })

const router = Router()

router.get("/", async (req, res) => {
  try {
    const especialidades = await prisma.especialidade.findMany()
    res.status(200).json(especialidades)
  } catch (error) {
    res.status(400).json(error)
  }
})


router.post("/", async (req, res) => {
  const { descricao } = req.body

  if (!descricao ) {
    res.status(400).json({ "erro": "Informe descricao" })
    return
  }

  try {
    const especialidade = await prisma.especialidade.create({
      data: { descricao }
    })
    res.status(201).json(especialidade)
  } catch (error) {
    res.status(400).json(error)
  }
})


router.delete("/:id", async (req, res) => {
  const { id } = req.params

  try {
    const especialidade = await prisma.especialidade.delete({
      where: { id: Number(id) }
    })
    res.status(200).json(especialidade)
  } catch (error) {
    res.status(400).json(error)
  }
})


router.put("/:id", async (req, res) => {
  const { id } = req.params
  const { descricao } = req.body

  if (!descricao ) {
    res.status(400).json({ "erro": "Informe descricao" })
    return
  }

  try {
    const especialidade = await prisma.especialidade.update({
      where: { id: Number(id) },
      data: { descricao }
    })
    res.status(200).json(especialidade)
  } catch (error) {
    res.status(400).json(error)
  }
})


export default router