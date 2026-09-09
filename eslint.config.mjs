import { dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { FlatCompat } from "@eslint/eslintrc"

const __dirname = dirname(fileURLToPath(import.meta.url))

const compat = new FlatCompat({ baseDirectory: __dirname })

const config = [
  {
    ignores: [".next/**", "node_modules/**", "next-env.d.ts", "public/**", "coverage/**"],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Textes en français avec apostrophes dans le JSX.
      "react/no-unescaped-entities": "off",
      // Le code existant utilise `any` pour les JSON Prisma (group_members) ; on avertit sans bloquer.
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
    },
  },
]

export default config
