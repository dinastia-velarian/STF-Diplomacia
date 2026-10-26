# Implantação do STF Diplomacia (RP)

## Estado do projeto
O código-fonte contém portal público, cadastro e sessões, protocolo de ações, fila judicial, distribuição de relatoria, admissibilidade e publicação de decisões individuais pelo relator. Não é um serviço oficial do STF brasileiro.

**Não libere usuários reais sem executar as verificações abaixo.** O repositório por si só não confirma que o Worker foi implantado ou que o banco D1 está funcionando.

## Banco Cloudflare D1
1. No painel Cloudflare, abra o banco D1 **stf_diplomacia** e copie seu identificador real.
2. No `wrangler.toml`, descomente o bloco `[[d1_databases]]`, mantenha `binding = "DB"` e `database_name = "stf_diplomacia"`, e substitua `database_id` pelo identificador copiado.
3. Faça backup do banco antes de aplicar migrações em um banco já usado.
4. Execute `npm install`, `npx wrangler d1 migrations apply stf_diplomacia --remote` e `npm run deploy` em ambiente autorizado.
5. Confirme as tabelas `users`, `roles`, `cases`, `decisions`, `case_events` e `audit_logs`. Confirme os papéis `minister`, `president`, `court_clerk` e `technical_admin`.

## Nomeação inicial de magistrados
Não há nomeação automática de administrador ou presidente. Primeiro, crie as contas normalmente. Um operador autorizado do banco poderá atribuir os cargos por SQL, substituindo os nomes por usuários existentes:

```sql
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u CROSS JOIN roles r
WHERE u.game_username = 'NOME_EXATO_DO_JOGADOR'
  AND r.name = 'president';
```

Para ministros, utilize `minister`. Para a Secretaria, utilize `court_clerk`. O cargo `technical_admin` não concede poder judicial.

## Testes obrigatórios antes da abertura
- `npm run dev` e compilação TypeScript (`npx tsc --noEmit`) sem erros.
- Cadastro, login, sessão expirada, logout e tentativas de acesso sem autenticação.
- Acesso negado à fila por cidadão comum e por administrador técnico sem cargo judicial.
- Distribuição apenas pela Presidência ou Secretaria; relator deve ser magistrado ativo.
- Admissibilidade apenas pelo relator, com fundamentação e sem repetição.
- Publicação apenas pelo relator após admissibilidade; decisão publicada não pode ser editada ou excluída.
- Auditoria, eventos e alteração de status devem ser gravados juntos; simular falhas e concorrência.
- Confirmação de que decisões publicadas aparecem no portal público.
- Testes de segurança: CSRF, XSS, abuso de cadastro/login, limitação de requisições e proteção de dados.
- Validar se a configuração de build/deploy da Cloudflare usa o `wrangler.toml` atualizado.

## Limitações atuais
- O fluxo implementado publica **decisões individuais do relator**; não representa julgamento colegiado ou votação do plenário.
- Não há gestão visual de nomeações, petições de defesa, upload de provas, recursos, recuperação de senha ou limites de tentativas de login.
- É necessário definir regras de regimento interno e quórum antes de desenvolver votação colegiada.
- Não habilite documentos privados ou contas públicas em produção até revisar permissões, privacidade, monitoramento e recuperação de incidentes.
