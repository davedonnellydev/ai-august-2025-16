# Project 16 #AIAugustAppADay: AI-Powered Flashcard Generator

![Last Commit](https://img.shields.io/github/last-commit/davedonnellydev/ai-august-2025-16)

**📆 Date**: 26/Aug/2025  
**🎯 Project Objective**: Enter a topic, AI generates flashcards.  
**🚀 Features**: Enter topic; AI creates Q&A flashcards; Flip to reveal answer; User can set level of difficulty.  
**🛠️ Tech used**: Next.js, TypeScript, Mantine UI, OpenAI APIs  
**▶️ Live Demo**: [https://dave-donnelly-ai-august-16.netlify.app/](https://dave-donnelly-ai-august-16.netlify.app/)  

## 🗒️ Summary

This project was a simple but useful one: an app that generates **question-and-answer flashcards** on any topic provided by the user.  

Because of other job-hunt activities, I started late in the day — but still managed to get to a solid MVP. The key was breaking the project into smaller pieces and using Cursor AI to focus on each part individually, while keeping the overall flow in mind. A big help was adding a **Cursor “rule” document** containing the app’s architecture and objective. With that context, Cursor’s code suggestions were more accurate and only needed minor tweaks.  

The main concern I came away with was around **trusting AI-generated code**. When I started this challenge, I promised myself I’d only use code I understood. And while I usually do, the time crunch sometimes tempts me to rely on user testing to confirm functionality without scrutinising the code itself. This is a risky habit to slip into. While I’m glad this challenge is almost over, it leaves me curious about how developers balance speed and scrutiny in real-world projects where time pressure is real.  

**Lessons learned**  
- Breaking projects into smaller, staged chunks makes collaboration with AI smoother.  
- Cursor “rules” are a powerful way to guide AI with project context.  
- Time pressure can encourage shortcuts — but it’s important to maintain discipline around code review and understanding.  

**Final thoughts**  
A simple but effective project, and another reminder that while AI speeds things up, responsibility for code quality and maintainability still rests with me.  


This project has been built as part of my AI August App-A-Day Challenge. You can read more information on the full project here: [https://github.com/davedonnellydev/ai-august-2025-challenge](https://github.com/davedonnellydev/ai-august-2025-challenge).

## 🧪 Testing

![CI](https://github.com/davedonnellydev/ai-august-2025-16/actions/workflows/npm_test.yml/badge.svg)  
_Note: Test suite runs automatically with each push/merge._

## Quick Start

1. **Clone and install:**

   ```bash
   git clone https://github.com/davedonnellydev/ai-august-2025-16.git
   cd ai-august-2025-16
   npm install
   ```

2. **Set up environment variables:**

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your values
   ```

3. **Start development:**

   ```bash
   npm run dev
   ```

4. **Run tests:**
   ```bash
   npm test
   ```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in the root directory:

```bash
# OpenAI API (for AI features)
OPENAI_API_KEY=your_openai_api_key_here

```

### Key Configuration Files

- `next.config.mjs` – Next.js config with bundle analyzer
- `tsconfig.json` – TypeScript config with path aliases (`@/*`)
- `theme.ts` – Mantine theme customization
- `eslint.config.mjs` – ESLint rules (Mantine + TS)
- `jest.config.cjs` – Jest testing config
- `.nvmrc` – Node.js version

### Path Aliases

```ts
import { Component } from '@/components/Component'; // instead of '../../../components/Component'
```

## 📦 Available Scripts

### Build and dev scripts

- `npm run dev` – start dev server
- `npm run build` – bundle application for production
- `npm run analyze` – analyze production bundle

### Testing scripts

- `npm run typecheck` – checks TypeScript types
- `npm run lint` – runs ESLint
- `npm run jest` – runs jest tests
- `npm run jest:watch` – starts jest watch
- `npm test` – runs `prettier:check`, `lint`, `typecheck` and `jest`

### Other scripts

- `npm run prettier:check` – checks files with Prettier
- `npm run prettier:write` – formats files with Prettier

## 📜 License

![GitHub License](https://img.shields.io/github/license/davedonnellydev/ai-august-2025-16)  
This project is licensed under the MIT License.
