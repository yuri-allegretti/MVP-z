import { describe, expect, it } from "vitest";
import { normalizeDescription } from "../src/services/normalization";

describe("normalizeDescription", () => {
  it("remove acentos, caracteres especiais, numeros e espacos duplicados", () => {
    expect(normalizeDescription("PIX ENVIADO - IMOBILIARIA SAO JOSE LTDA 12345")).toBe(
      "pix enviado imobiliaria sao jose ltda"
    );
  });

  it("retorna string vazia para entrada vazia", () => {
    expect(normalizeDescription("   ")).toBe("");
  });
});
