# Implantação automatizada — STF Diplomacia

O workflow `.github/workflows/deploy.yml` valida o TypeScript, aplica migrações D1 e publica o Worker.

## Configuração inicial obrigatória
1. No GitHub, em Settings → Environments, crie o ambiente `production` e proteja-o com aprovação manual para produção, se desejado.
2. Em Settings → Secrets and variables → Actions, crie os segredos `CLOUDFLARE_API_TOKEN` e `CLOUDFLARE_ACCOUNT_ID`. Nunca envie esses valores em chats ou commits.
3. Gere o token na Cloudflare com permissões mínimas para Workers Scripts (Edit), D1 (Edit) e leitura dos recursos necessários, limitado à conta correta.
4. No D1, abra o banco `stf_diplomacia` e copie seu **Database ID** (UUID). Edite `wrangler.toml`, descomentando `[[d1_databases]]`, usando binding `DB`, nome `stf_diplomacia` e o UUID real.
5. O binding R2 é opcional por enquanto; habilite-o quando o bucket estiver criado.
6. Em Actions → Deploy STF to Cloudflare → Run workflow, execute o primeiro deploy. Acompanhe os logs e confirme o status.

**Atenção:** o GitHub Actions será o responsável pela publicação. Evite configurar dois mecanismos de deploy simultâneos (integração Git nativa da Cloudflare e Actions), pois podem competir.

O esquema `0001_initial.sql` é uma migração. Se já tiver sido executado manualmente no banco, não execute novamente sem reconciliar o histórico de migrações. O pipeline falhará de forma segura caso a migração não possa ser aplicada; não apague tabelas existentes para contornar erros.

Não utilize dados reais até implementar autenticação, autorização e testes de segurança.
