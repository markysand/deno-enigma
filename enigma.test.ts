import {
  Base,
  Enigma,
  PlugBoard,
  Reflector,
  Rotor,
  RotorGroup,
  RotorState,
  Direction,
} from "./enigma.ts";
import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.108.0/testing/asserts.ts";

Deno.test("enigma/wikipedia_rotors", () => {
  // https://en.wikipedia.org/wiki/Enigma_rotor_details
  //
  // With the rotors I, II and III (from left to right), wide B-reflector,
  // all ring settings in A-position, and start position AAA, typing AAAAA
  // will produce the encoded sequence BDZGO.

  const E = Enigma.create(
    [Rotor.label.I, Rotor.label.II, Rotor.label.III],
    Reflector.label.B,
    "",
    "AAA" /* 24, 13, 22 */,
    "AAA"
  );

  const plaintext = "aaaaa";
  const ciphertext = "bdzgo".toUpperCase();

  const actual = E.encodeString(plaintext);

  assertEquals<string>(actual, ciphertext);
});

Deno.test("enigma/manual_anno_1930", () => {
  // http://wiki.franklinheath.co.uk/index.php/Enigma/Sample_Messages#Enigma_Instruction_Manual.2C_1930
  const E = Enigma.create(
    [Rotor.label.II, Rotor.label.I, Rotor.label.III],
    Reflector.label.A,
    "AM FI NV PS TU WZ",
    "XMV" /* 24, 13, 22 */,
    "ABL"
  );

  const ciphertext =
    "GCDSE AHUGW TQGRK VLFGX UCALX VYMIG MMNMF DXTGN VHVRM MEVOU YFZSL RHDRR XFJWC FHUHM UNZEF RDISI KBGPM YVXUZ";

  const plaintext =
    "FEIND LIQEI NFANT ERIEK OLONN EBEOB AQTET XANFA NGSUE DAUSG ANGBA ERWAL DEXEN DEDRE IKMOS TWAER TSNEU STADT".replaceAll(
      " ",
      ""
    );

  const actualPlaintext = E.encodeString(ciphertext);

  assertEquals(actualPlaintext, plaintext);
});

Deno.test("reflector/standard", () => {
  const r = new Reflector("ZYXWVUTSRQPONMLKJIHGFEDCBA");

  assertEquals(r.encode(Base.charToNumber("B")), Base.charToNumber("Y"));
});

Deno.test("reflector/errors/length", () => {
  assertThrows(
    () => {
      new Reflector("ABCD");
    },
    Error,
    "length"
  );
});

Deno.test("reflector/errors/reflective", () => {
  assertThrows(
    () => {
      new Reflector("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
    },
    Error,
    "reflective"
  );
});

Deno.test("plugboard/standard", () => {
  const p = new PlugBoard("DF AC");

  assertEquals(p.encode(Base.charToNumber("U")), Base.charToNumber("U"));
  assertEquals(p.encode(Base.charToNumber("D")), Base.charToNumber("F"));
  assertEquals(p.encode(Base.charToNumber("C")), Base.charToNumber("A"));
});

Deno.test("plugboard/zero_config", () => {
  const p = new PlugBoard("");

  p.mapping.forEach((value, index) => {
    assertEquals(value, index);
  });
});

Deno.test("rotor/null_setting", () => {
  const r = new Rotor("ABCDEFGHIJKLMNOPQRSTUVWXYZ", "");

  assertEquals(
    r.encode(Base.charToNumber("U"), Direction.FORWARD),
    Base.charToNumber("U")
  );
  assertEquals(
    r.encode(Base.charToNumber("A"), Direction.FORWARD),
    Base.charToNumber("A")
  );
  assertEquals(
    r.encode(Base.charToNumber("X"), Direction.FORWARD),
    Base.charToNumber("X")
  );
});

Deno.test("rotor/encode", () => {
  const r = new Rotor("BCADEFGHIJKLMNOPQRSTUVWXYZ", "");

  assertEquals(
    r.encode(Base.charToNumber("A"), Direction.FORWARD),
    Base.charToNumber("B")
  );
  assertEquals(
    r.encode(Base.charToNumber("B"), Direction.FORWARD),
    Base.charToNumber("C")
  );
  assertEquals(
    r.encode(Base.charToNumber("C"), Direction.FORWARD),
    Base.charToNumber("A")
  );

  assertEquals(
    r.encode(Base.charToNumber("B"), Direction.REVERSE),
    Base.charToNumber("A")
  );
  assertEquals(
    r.encode(Base.charToNumber("C"), Direction.REVERSE),
    Base.charToNumber("B")
  );
  assertEquals(
    r.encode(Base.charToNumber("A"), Direction.REVERSE),
    Base.charToNumber("C")
  );
});

Deno.test("rotor_state/basic", () => {
  const rs = new RotorState(
    new Rotor("EKMFLGDQVZNTOWYHXUSPAIBRCJ", ""),
    0,
    Base.charToNumber("B")
  );

  assertEquals(
    rs.encode(Base.charToNumber("A"), Direction.FORWARD),
    Base.charToNumber("J")
  );
  assertEquals(
    rs.encode(Base.charToNumber("J"), Direction.REVERSE),
    Base.charToNumber("A")
  );
});

Deno.test("rotor_group/advance", () => {
  const r1 = new Rotor("ABCDEFGHIJKLMNOPQRSTUVWXYZ", "B");

  const rg = new RotorGroup([
    new RotorState(r1, 0, 0),
    new RotorState(r1, 0, 0),
    new RotorState(r1, 0, 0),
  ]);

  rg.advance();
  assertEquals(
    rg.rotorStates.map((rs) => rs.position),
    [0, 0, 1]
  );

  rg.advance();
  assertEquals(
    rg.rotorStates.map((rs) => rs.position),
    [0, 1, 2]
  );

  rg.advance();
  assertEquals(
    rg.rotorStates.map((rs) => rs.position),
    [1, 2, 3]
  );

  rg.advance();
  assertEquals(
    rg.rotorStates.map((rs) => rs.position),
    [1, 2, 4]
  );

  rg.advance();
  assertEquals(
    rg.rotorStates.map((rs) => rs.position),
    [1, 2, 5]
  );

  rg.advance();
  assertEquals(
    rg.rotorStates.map((rs) => rs.position),
    [1, 2, 6]
  );
});

Deno.test("base_block/static_assert_length", () => {
  assertThrows(
    () => {
      Base.assertLength([
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12,
        "boom",
        14,
        15,
        16,
        17,
        18,
        19,
        20,
        21,
        22,
        23,
        24,
        25,
        26,
        // deno-lint-ignore no-explicit-any
      ] as any);
    },
    Error,
    "finite number"
  );
});
