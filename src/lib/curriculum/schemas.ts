import { z } from "zod";

import { UNIT_KINDS } from "./types";

/**
 * Validation shared by the admin forms (react-hook-form) and the server
 * actions. Defining it once means the client can't submit something the
 * server would reject.
 */

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value ? value : null));

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .refine(
    (value) => !value || URL.canParse(value),
    "Enter a valid URL, or leave this empty.",
  )
  .transform((value) => (value ? value : null));

export const unitFormSchema = z.object({
  title: z.string().trim().min(1, "Give the unit a title.").max(120),
  slug: z
    .string()
    .trim()
    .min(1, "Give the unit a slug.")
    .max(60)
    .regex(
      /^[a-z0-9]+(-[a-z0-9]+)*$/,
      "Lowercase letters, numbers and single hyphens only (e.g. unit-2).",
    ),
  kind: z.enum(UNIT_KINDS),
  description: optionalText(500),
  orderIndex: z.coerce.number().int().min(0).max(9999),
  isPublished: z.boolean(),
});

export const itemFormSchema = z.object({
  primaryLabel: z.string().trim().min(1, "This is required.").max(32),
  secondaryLabel: optionalText(32),
  illustrationUrl: optionalUrl,
  audioUrl: optionalUrl,
  speechText: optionalText(200),
  orderIndex: z.coerce.number().int().min(0).max(9999),
});

export const exampleFormSchema = z.object({
  label: z.string().trim().min(1, "Enter the word.").max(60),
  imageUrl: optionalUrl,
  audioUrl: optionalUrl,
  speechText: optionalText(200),
  orderIndex: z.coerce.number().int().min(0).max(9999),
});

/** What the form fields hold before zod's transforms run. */
export type UnitFormInput = z.input<typeof unitFormSchema>;
export type ItemFormInput = z.input<typeof itemFormSchema>;
export type ExampleFormInput = z.input<typeof exampleFormSchema>;

/** What the server actions receive. */
export type UnitFormValues = z.output<typeof unitFormSchema>;
export type ItemFormValues = z.output<typeof itemFormSchema>;
export type ExampleFormValues = z.output<typeof exampleFormSchema>;
