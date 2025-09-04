# Hedge

Automated currency protection for LATAM using Stellar and Reflector oracles.

## Overview

Hedge protects your purchasing power by automatically converting a portion of your salary to USD when your local currency weakens beyond a configurable threshold. Built on Stellar with real-time exchange rates from Reflector oracles.

### Supported Currencies
- 🇲🇽 MXN (Mexican Peso)
- 🇨🇴 COP (Colombian Peso) 
- 🇧🇷 BRL (Brazilian Real)
- 🇦🇷 ARS (Argentine Peso)
- 🇨🇱 CLP (Chilean Peso)

## Quick Start

1. **Clone and setup**
   ```bash
   git clone <your-repo>
   cd hedge
   ./setup.sh
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd frontend && npm install
   ```

3. **Build contracts**
   ```bash
   npm run contract:build
   ```

4. **Start development**
   ```bash
   npm run dev
   ```

## Architecture

- **Smart Contract**: Soroban contract with Reflector oracle integration
- **Frontend**: React + TypeScript with minimal, mobile-first UI
- **Oracle**: Reflector for real-time forex and crypto price feeds

## Features

- ⚡ Automatic conversion triggers based on currency devaluation
- 📊 Real-time exchange rates via Reflector oracles
- 📱 Mobile-first, intuitive interface
- 🔒 Non-custodial - you control your funds
- 📈 Historical tracking and protection metrics

## Development

See individual README files in:
- `contracts/hedge/README.md` - Smart contract details
- `frontend/README.md` - Frontend development
- `docs/` - Complete documentation

## Built For

**Stellar Hacks: KALE x Reflector Composability Hackathon**

Demonstrating real-world composability by building directly on Reflector's oracle infrastructure to solve actual problems faced by LATAM workers and professionals.

## License

MIT