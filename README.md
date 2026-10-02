# Synth Operator

A sound design synthesis workbench and parameter architecture engine built with **Next.js 16**, **React 19**, and **Electron**. Features sound design rule compilers, synthesizer schema models (`lib/engine/synthSchemas.js`), preset parsing, and an interactive sound design manual.

## Features

- **Synthesizer Schemas**: Declarative parameter specifications across oscillator topologies, filter matrices, envelopes, and modulation matrices.
- **Preset Parsers**: Ingests and inspects synth patch presets to extract macro parameter positions.
- **Sound Design Rules Engine**: Algorithmic rules providing suggestions for sound design targets (basses, leads, pads, plucks, SFX).
- **Next.js 16 & React 19 Architecture**: Utilizes React 19 component primitives, client actions, and modular CSS.

## Dependencies

### Runtime Dependencies
- `next`: ^16.2.0 (App router, Server & Client component architecture)
- `react` & `react-dom`: ^19.2.0 (React 19 framework)

### Development Dependencies
- `electron`: Native desktop application host
- `eslint`: Code linting
- `postcss`: CSS transformation

## Instructions

See [INSTRUCTIONS.md](./INSTRUCTIONS.md) for setup and dev commands.

## License

This project is licensed under the GNU General Public License v3.0 (GPL-3.0) - see the [LICENSE](./LICENSE) file for details.
