# FLUXO OFICIAL DO SISTEMA

**Login → Sala Principal → Workspace → Ativação de Ferramentas → Criação de Sala → Configuração de Campanha → Jogando**
Com máquina de estados controlada e regras de governança.

---

## 1️⃣ LOGIN
**Objetivo:** Autenticar o usuário e criar sua identidade no sistema.

**Métodos:**
- Login Google (Auth)
- Login Anônimo

**Estrutura criada:**
```json
users/{uid} {
  "role": null,
  "profile": {
    "displayName": "",
    "avatar": ""
  }
}
```
*Após autenticação: ➡ Redirecionar para Sala Principal*

---

## 2️⃣ SALA PRINCIPAL
**Central de Navegação**

**Funções disponíveis:**
- Criar Workspace
- Acessar Workspace existente
- Editar perfil
- Entrar em sala por código

*⚠ Não é permitido criar sala sem Workspace definido.*

---

## 3️⃣ WORKSPACE
Usuário deve escolher:
- 🛡 Workspace de Jogador 
ou
- 🧙 Workspace de Narrador

Essa escolha define permissões estruturais permanentes.

### 🛡 WORKSPACE DE JOGADOR
**Permissões:**
- Editar perfil
- Criar tokens próprios
- Gerenciar ficha
- Participar de salas
- **Não pode** criar sala
- **Não pode** ativar ferramentas globais

**Estrutura:**
```json
users/{uid} {
  "role": "player",
  "playerWorkspace": {
    "tokens": [],
    "characterSheets": []
  }
}
```

### 🧙 WORKSPACE DE NARRADOR
**Permissões:**
- Criar salas
- Configurar campanhas
- Ativar ferramentas
- Configurar APIs
- Transferir Host (somente em Lobby)
- Interromper campanha

**Estrutura:**
```json
users/{uid} {
  "role": "narrator",
  "narratorWorkspace": {
    "availableSystems": ["dnd5e", "tormenta20"],
    "apiIntegrations": {
      "aiChat": false,
      "music": false
    },
    "apiKeys": {
      "openai": "encrypted",
      "musicService": "encrypted"
    }
  }
}
```
*🔐 API Keys pertencem exclusivamente ao Workspace. Nunca são armazenadas em sala.*

---

## 4️⃣ ATIVAÇÃO DE FERRAMENTAS (NO WORKSPACE)
O Narrador configura:
- Sistemas disponíveis
- Integrações API que possui
- Armazena suas chaves com criptografia

Isso não ativa ferramentas em sala. Apenas habilita a possibilidade de ativação futura.

---

## 5️⃣ CRIAÇÃO DE SALA
Somente Narrador pode criar.

**Ao criar:**
```json
rooms/{roomId} {
  "ownerId": "uid",
  "state": "lobby",
  "enabledFeatures": {
    "dice": false,
    "aiChat": false,
    "music": false
  },
  "campaignConfig": {
    "roomName": null,
    "campaignName": null,
    "systemId": null
  },
  "participants": []
}
```
Todas ferramentas começam como OFF.
Estado inicial: `"lobby"`

---

## 6️⃣ CONFIGURAÇÃO DE CAMPANHA
Disponível apenas se: `room.state == "lobby"`

**O Host define:**
- Nome da Sala (roomName)
- Nome da Campanha (campaignName)
- Sistema de Regras (systemId)
- Mapa (opcional)
- Grid (opcional)
- Senha (opcional)

### 🎯 REQUISITOS MÍNIMOS PARA INICIAR CAMPANHA
Antes de iniciar, validar:
- ✅ roomName preenchido
- ✅ campaignName preenchido
- ✅ systemId definido
- ✅ systemId pertence ao availableSystems do Host atual

**Validação lógica:**
```javascript
if (!roomName) bloquear;
if (!campaignName) bloquear;
if (!systemId) bloquear;
if (!hostWorkspace.availableSystems.includes(systemId)) bloquear;
```
*Se qualquer falhar → botão “Iniciar Campanha” desabilitado.*

---

## 7️⃣ ATIVAÇÃO DE FERRAMENTAS NA SALA
Ainda no estado `"lobby"`. 
Somente o Host pode ativar.

**Regras de ativação**
Para ferramentas que exigem API:
```javascript
if (tool.requiresAPI && !workspace.apiIntegrations[tool.id])
   botão = desabilitado;
```
*Se Host não tiver API configurada → botão aparece cinza.*

Ao ativar: `room.enabledFeatures.aiChat = true`
Sala apenas guarda ON/OFF. API continua no Workspace.

---

## 8️⃣ INICIAR CAMPANHA
Se todas validações passarem: `room.state = "in_game"`
Sala entra em modo ativo.

---

## 9️⃣ JOGANDO (ESTADO IN_GAME)
**Funcionalidades ativas:**
- Grid
- Tokens sincronizados
- Chat
- Dados
- Ferramentas habilitadas
- APIs chamadas via Função/Middleware usando chave do Host

### 🚫 BLOQUEIOS DURANTE IN_GAME
Enquanto `room.state == "in_game"` não é permitido:
- Transferir Host
- Alterar ownerId
- Modificar sistema
- Resetar campanha estruturalmente

---

## 🔟 INTERROMPER CAMPANHA
Botão disponível apenas para Host.

**Executa:** `room.state = "lobby"`

Isso:
- Mantém configurações
- Mantém tokens
- Permite ajustes
- Permite transferência de Host

---

## 1️⃣1️⃣ TRANSFERÊNCIA DE HOST
Permitido apenas se: `room.state == "lobby"`

**Fluxo:**
1. Host seleciona novo Narrador
2. **Sistema alerta:** "Todas ferramentas que utilizam API serão desativadas."
3. **Sistema executa reset:**
   ```javascript
   room.enabledFeatures.aiChat = false
   room.enabledFeatures.music = false
   // (Apenas ferramentas com requiresAPI = true)
   ```
4. **Sistema altera:** `room.ownerId = newHostUid`

### 🔎 VALIDAÇÃO DO SISTEMA APÓS TRANSFERÊNCIA
**Se:** `!newHostWorkspace.availableSystems.includes(room.campaignConfig.systemId)`
**Então:** `room.campaignConfig.systemId = null`
**E exibe aviso:** *"O novo Host deve selecionar um sistema válido antes de iniciar a campanha."*
Botão Iniciar Campanha permanece desabilitado até correção.

---

## 1️⃣2️⃣ ESTRUTURA GLOBAL FINAL
```text
Auth
 ↓
Users
 ├── profile
 ├── playerWorkspace
 └── narratorWorkspace
      ├── availableSystems
      ├── apiIntegrations
      └── apiKeys (criptografadas)

Rooms
 ├── ownerId
 ├── state (lobby | in_game)
 ├── enabledFeatures
 ├── campaignConfig
 └── participants
```

---

## 🔐 PRINCÍPIOS ARQUITETURAIS CONSOLIDADOS
- ✔ Workspace separado da Sala
- ✔ API Keys nunca saem do Workspace
- ✔ Sala nunca armazena credenciais
- ✔ Host sempre é Narrador
- ✔ Campanha exige validação mínima
- ✔ Sistema de regras é obrigatório
- ✔ Sistema deve existir no Workspace do Host
- ✔ Transferência só ocorre em Lobby
- ✔ Transferência reseta ferramentas API
- ✔ Novo Host deve reativar manualmente
- ✔ Estado `in_game` bloqueia alteração estrutural
- ✔ Máquina de estados clara e controlada
