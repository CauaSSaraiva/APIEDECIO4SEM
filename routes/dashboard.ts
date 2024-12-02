import { PrismaClient } from "@prisma/client"
import { Router } from "express"

const prisma = new PrismaClient()
const router = Router()

router.get("/gerais", async (req, res) => {
  try {
    const clientes = await prisma.cliente.count()
    const medicos = await prisma.medico.count()
    const consultas = await prisma.consulta.count()
    res.status(200).json({ clientes, medicos, consultas })
  } catch (error) {
    res.status(400).json(error)
  }
})

router.get("/medicosEspecialidade", async (req, res) => {
  try {
    const medicos = await prisma.medico.groupBy({
      by: ['especialidadeId'],
      _count: {
        id: true, 
      }
    })

    // Para cada medico, inclui o nome da marca relacionada ao marcaId
    const medicosMarca = await Promise.all(
      medicos.map(async (medico) => {
        const especialidade = await prisma.especialidade.findUnique({
          where: { id: medico.especialidadeId }
        })
        return {
          especialidade: especialidade?.descricao, 
          num: medico._count.id
        }
      })
    )
    res.status(200).json(medicosMarca)
  } catch (error) {
    res.status(400).json(error)
  }
})

export default router
