# SmartShamba System Readiness Checklist

## Infrastructure

- [ ] Supabase automated backups confirmed enabled
- [ ] All Vercel env vars present and correct
- [ ] HTTPS enforced on all routes
- [ ] Latest Vercel deployment healthy
- [ ] Prisma migrations in sync

## Security

- [ ] All admin routes protected with requireAdminAuth
- [ ] Public endpoints reviewed
- [ ] Rate limiting verified
- [ ] Input validation reviewed

## Payments

- [ ] M-PESA OAuth working
- [ ] Callback endpoint reachable
- [ ] Duplicate transaction protection verified
- [ ] Underpayment protection verified
- [ ] SMS notification flow verified
- [ ] C2B registration verified or documented as sandbox limitation

## Operations

- [ ] Health endpoint operational
- [ ] Structured logging review completed
- [ ] Error monitoring plan documented

## Documentation

- [ ] Pilot testing plan documented
- [ ] Operations runbook planned