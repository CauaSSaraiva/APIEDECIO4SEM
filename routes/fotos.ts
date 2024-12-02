import { PrismaClient } from "@prisma/client"
import { Router } from "express"
import multer from 'multer'


const upload = multer({ storage: multer.memoryStorage() })

// const prisma = new PrismaClient()
const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'stdout',
      level: 'error',
    },
    {
      emit: 'stdout',
      level: 'info',
    },
    {
      emit: 'stdout',
      level: 'warn',
    },
  ],
})

prisma.$on('query', (e) => {
  console.log('Query: ' + e.query)
  console.log('Params: ' + e.params)
  console.log('Duration: ' + e.duration + 'ms')
})

const router = Router()

router.get("/:medicoId", async (req, res) => {
  const { medicoId } = req.params

  try {
    const fotos = await prisma.foto.findMany({
      where: { medicoId: Number(medicoId) }
    })
    res.status(200).json(fotos)
  } catch (error) {
    res.status(400).json(error)
  }
})

router.post("/", upload.single('codigoFoto'), async (req, res) => {
  const { descricao, medicoId } = req.body
  const codigo = req.file?.buffer.toString("base64")

  if (!descricao || !medicoId || !codigo) {
    res.status(400).json({ "erro": "Informe descricao, medicoId e codigoFoto" })
    return
  }

  try {
    const foto = await prisma.foto.create({
      data: {
        descricao, medicoId: Number(medicoId),
        codigoFoto: codigo as string
      }
    })
    res.status(201).json(foto)
  } catch (error) {
    res.status(400).json(error)
  }
})



export default router