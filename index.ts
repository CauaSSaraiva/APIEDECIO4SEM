import express from 'express'
import cors from 'cors'
import especialidadesRoutes from './routes/especialidades'
import medicosRoutes from './routes/medicos'
import clientesRoutes from './routes/clientes'
import fotosRoutes from './routes/fotos'
import consultasRoutes from './routes/consultas'
import adminRoutes from './routes/admins'
import dashboardRoutes from './routes/dashboard'
const app = express()
// porta 3000 next usa por padrão
const port = 3004

app.use(express.json())
app.use(cors())
app.use("/especialidades", especialidadesRoutes)
app.use("/medicos", medicosRoutes)
app.use("/clientes", clientesRoutes)
app.use("/fotos", fotosRoutes)
app.use("/consultas", consultasRoutes)
app.use("/admins", adminRoutes)
app.use("/dashboard", dashboardRoutes);

app.get('/', (req, res) => {
  res.send('API: Sistema de Consulta Médica')
})

app.listen(port, () => {
  console.log(`Servidor rodando na porta: ${port}`)
})

