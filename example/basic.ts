import { Enigma, Reflector, Rotor } from "../enigma.ts";

// Execute this with Deno:
//
//   > deno run ./basic.ts my message
//
//   output: AWHQVGXUG

function main(args: string[]) {
  const E = Enigma.create(
    [Rotor.label.VIII, Rotor.label.II, Rotor.label.III],
    Reflector.label.B,
    "CT BX ZW PI VM NO",
    "AAA",
    "CUX"
  );

  console.log(E.encodeString(args.join("")));
}

main(Deno.args);
