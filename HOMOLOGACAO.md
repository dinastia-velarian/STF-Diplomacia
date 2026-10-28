# Homologação do STF Diplomacia

## Critérios para lançamento

- [ ] TypeScript e testes locais aprovados no GitHub Actions.
- [ ] Backup verificado do banco D1 de produção antes de migrações.
- [ ] Migrações pendentes conferidas e aplicadas sem apagar dados.
- [ ] Commit em produção confirmado no Cloudflare Workers.
- [ ] Autenticação e permissões de cidadão, magistrado, presidente e superadministrador verificadas.
- [ ] Protocolo, distribuição, admissibilidade, julgamento e publicação testados com dados fictícios.
- [ ] Arquivamento e restauração testados sem alterar processos reais.
- [ ] Configuração de sanções restrita ao superadministrador e auditada.
- [ ] Consulta pública verificada sem exposição de dados sigilosos.

## Procedimento seguro

1. Executar npm ci, npm run check e npm test em ambiente isolado.
2. Conferir a lista de migrações e a situação do D1 remoto.
3. Criar e verificar backup de produção antes de qualquer migração.
4. Aplicar somente migrações pendentes e autorizadas.
5. Publicar o Worker após aprovação dos testes.
6. Homologar com contas e processos identificados como TESTE, preservando registros reais.
7. Registrar commit, versão publicada, horário e resultados.

O catálogo administrativo de sanções não aplica punições a processos automaticamente. A administração técnica não substitui decisões judiciais. Não declarar o portal homologado sem evidência dos testes e da publicação.
