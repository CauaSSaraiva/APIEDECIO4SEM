import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import { verificaToken } from "../middlewares/verificaToken";

const prisma = new PrismaClient();
const router = Router();

router.get("/", async (req, res) => {
  try {
    const clientes = await prisma.cliente.findMany();
    res.status(200).json(clientes);
  } catch (error) {
    res.status(400).json(error);
  }
});

function validaSenha(senha: string) {
  const mensa: string[] = [];

  // .length: retorna o tamanho da string (da senha)
  if (senha.length < 8) {
    mensa.push("Erro... senha deve possuir, no mínimo, 8 caracteres");
  }

  // contadores
  let pequenas = 0;
  let grandes = 0;
  let numeros = 0;
  let simbolos = 0;

  // senha = "abc123"
  // letra = "a"

  // percorre as letras da variável senha
  for (const letra of senha) {
    // expressão regular
    if (/[a-z]/.test(letra)) {
      pequenas++;
    } else if (/[A-Z]/.test(letra)) {
      grandes++;
    } else if (/[0-9]/.test(letra)) {
      numeros++;
    } else {
      simbolos++;
    }
  }

  if (pequenas == 0 || grandes == 0 || numeros == 0 || simbolos == 0) {
    mensa.push(
      "Erro... senha deve possuir letras minúsculas, maiúsculas, números e símbolos"
    );
  }

  return mensa;
}

router.post("/", async (req, res) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    res.status(400).json({ erro: "Informe nome, email e senha" });
    return;
  }

  const consultaEmail = await prisma.cliente.findUnique({
    where: {
      email: email,
    },
  });

  if (consultaEmail != null) {
    res.status(400).json({ erro: "Ops... email já cadastrado" });
    return;
  }

  const erros = validaSenha(senha);
  if (erros.length > 0) {
    res.status(400).json({ erro: erros.join("; ") });
    return;
  }

  // 12 é o número de voltas (repetições) que o algoritmo faz
  // para gerar o salt (sal/tempero)
  const salt = bcrypt.genSaltSync(12);
  // gera o hash da senha acrescida do salt
  const hash = bcrypt.hashSync(senha, salt);

  // para o campo senha, atribui o hash gerado
  try {
    const cliente = await prisma.cliente.create({
      data: { nome, email, senha: hash },
    });
    res.status(201).json(cliente);
  } catch (error) {
    res.status(400).json(error);
  }
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id },
    });

    if (cliente == null) {
      res.status(400).json({ erro: "Não cadastrado" });
      return;
    } else {
      res.status(200).json({
        id: cliente.id,
        nome: cliente.nome,
        email: cliente.email,
      });
    }
  } catch (error) {
    res.status(400).json(error);
  }
});

router.post("/login", async (req, res) => {
  const { email, senha } = req.body;

  // em termos de segurança, o recomendado é exibir uma mensagem padrão
  // a fim de evitar de dar "dicas" sobre o processo de login para hackers
  const mensaPadrao = "Login ou senha incorretos";

  if (!email || !senha) {
    // res.status(400).json({ erro: "Informe e-mail e senha do usuário" })
    res.status(400).json({ erro: mensaPadrao });
    return;
  }

  try {
    const cliente = await prisma.cliente.findUnique({
      where: { email },
    });

    if (cliente == null) {
      // res.status(400).json({ erro: "E-mail inválido" })
      res.status(400).json({ erro: mensaPadrao });
      return;
    }

    // se o e-mail existe, faz-se a comparação dos hashs
    if (bcrypt.compareSync(senha, cliente.senha)) {
      res.status(200).json({
        id: cliente.id,
        nome: cliente.nome,
        email: cliente.email,
      });
    } else {
      // res.status(400).json({ erro: "Senha incorreta" })
      res.status(400).json({ erro: mensaPadrao });
    }
  } catch (error) {
    res.status(400).json(error);
  }
});

// async function enviaEmail1(nome: string, email: string, codigo: string) {
//   const transporter = nodemailer.createTransport({
//     host: "sandbox.smtp.mailtrap.io",
//     port: 587,
//     secure: false,
//     auth: {
//       user: "194ffc000de7d0",
//       pass: "158d0efaa4a7db",
//     },
//   });

//   const info = await transporter.sendMail({
//     from: "caua91@outlook.com", // sender address
//     to: email, // list of receivers
//     subject: "Código de Recuperação de Senha", // Subject line
//     text: "Utilize esse código para recuperar/alterar sua senha.", // plain text body
//     html: `<h3>Estimado Cliente: ${nome}</h3>
//            <h3>Seu Código de Recuperação: ${codigo}</h3>
//            <p>Consultas Médicas</p>`,
//   });

//   console.log("Message sent: %s", info.messageId);
// }


async function enviaEmail(
  nome: string,
  email: string,
  codigo: string,
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
    subject: "Código de Recuperação de Senha", // Subject line
    text: "Utilize esse código para recuperar/alterar sua senha.", // plain text body
    html: `<h3>Estimado Cliente: ${nome}</h3>
           <h3>Seu Código de Recuperação: ${codigo}</h3>
           <p>Consultas Médicas</p>`,
  });

    console.log("Message sent: %s", info.messageId);
  } catch (error) {
    console.error("erro enviando o email:", error);
  } finally {
    transporter.close();
  }
}




function gerarCodigo(tamanho: number) {
  const caracteres =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let codigo = "";
  for (let i = 0; i < tamanho; i++) {
    let indice = Math.floor(Math.random() * caracteres.length);
    codigo += caracteres[indice];
  }
  return codigo;
}

router.post("/enviar-codigo", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    // res.status(400).json({ erro: "Informe e-mail e senha do usuário" })
    res.status(400).json({
      erro: "Informe o email para enviar o código de recuperação da senha",
    });
    return;
  }

  try {
    const cliente = await prisma.cliente.findUnique({
      where: {
        email: email,
      },
    });

    if (!cliente) {
      res
        .status(400)
        .json({ erro: "Nenhum usuário com este email foi encontrado" });
      return;
    }

    const codigo = gerarCodigo(6);

    const user = await prisma.cliente.update({
      where: { id: cliente.id },
      data: { codigoRecuperacao: codigo },
    });

    await enviaEmail(
      cliente.nome as string,
      cliente.email as string,
      codigo as string
    );

    res.status(200).json({ message: "Código de recuperação enviado." });
  } catch (error) {
    res.status(400).json(error);
  }
});

router.post("/alterar-senha", async (req, res) => {
  const { email, codigoRecuperacao, novaSenha } = req.body;

  if (!email || !codigoRecuperacao || !novaSenha) {
    res.status(400).json({
      erro: "Informe o email, a nova senha e o seu código de recuperação.",
    });
    return;
  }

  try {
    const cliente = await prisma.cliente.findUnique({
      where: {
        email: email,
      },
    });

    if (!cliente) {
      res
        .status(400)
        .json({ erro: "Nenhum usuário com este email foi encontrado" });
      return;
    }

    if (cliente.codigoRecuperacao != codigoRecuperacao) {
      res.status(400).json({ erro: "Código de recuperação inválido." });
      return;
    }

    const erros = validaSenha(novaSenha);

    if (erros.length > 0) {
      res.status(400).json({ erro: erros.join("; ") });
      return;
    }

    const salt = bcrypt.genSaltSync(12);
    const hash = bcrypt.hashSync(novaSenha, salt);

    const user = await prisma.cliente.update({
      where: { id: cliente.id },
      data: { codigoRecuperacao: "", senha: hash },
    });

    res.status(200).json({ message: "Senha alterada com sucesso!" });
  } catch (error) {
    res.status(400).json(error);
  }
});







router.delete("/:id", verificaToken,async (req, res) => {
  const { id } = req.params;

  try {
    const cliente = await prisma.cliente.delete({
      where: { id: id },
    });
    res.status(200).json(cliente);
  } catch (error) {
    res.status(400).json(error);
  }
});

export default router;
