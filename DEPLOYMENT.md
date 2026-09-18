# SmartShamba Deployment Guide

## 1. Database Migrations
SmartShamba V2 uses `prisma db push` for schema synchronization during the pilot phase.
**Do NOT run `prisma migrate deploy` or `prisma migrate dev` in production.**

To apply schema changes:
```bash
npx prisma db push
