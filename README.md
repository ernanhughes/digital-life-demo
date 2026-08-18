# Digital Life Demo

Interactive companion for **Digital Life From First Principles**.

The goal is to turn the book's experimental argument into one continuous, explorable demonstration: a viewer should be able to watch the digital crystal persist, perturb it, damage it, give it a history, and eventually inspect the evidence behind each effect.

## Current milestone: visual engine foundation

This first slice establishes the browser experience:

- Canvas renders the evolving hexagonal crystal efficiently.
- D3/SVG renders causal zones, labels, and far-field intervention markers.
- Controls expose four initial scenes: observe, local intervention, damage, and history.
- The page is designed to work as a Programmer.ie/book hero as well as a standalone demo.

**Important:** the current cell motion and event timing are development fixtures, not experimental evidence. The next milestone replaces fixture dynamics with canonical replay data exported from the book's Python experiments.

## Run locally

```bash
npm install
npm run dev
```

Production check:

```bash
npm run build
```

## Architecture

```text
canonical Python experiments
        |
        v
experiment replay JSON
        |
        v
replay/state layer
        |
        +--------------------+
        |                    |
        v                    v
Canvas crystal renderer   D3/SVG evidence overlay
        |                    |
        +---------+----------+
                  |
                  v
          interactive story UI
```

The browser should remain a **scientific replay engine**, not an animation that invents results. Every claim-bearing visual state should ultimately be traceable to a named experiment, run, parameters, and measured output.

## Planned story

1. **Formation / persistence** — establish the ongoing process.
2. **Damage / return** — remove material and measure what returns.
3. **History** — create two similar present states with different pasts.
4. **Same intervention, different future** — demonstrate causal history dependence.
5. **Material turnover** — replace substrate while tracking process continuity.
6. **Finite-budget redistribution** — apply a local intervention and show distant selector-mediated changes.
7. **Evidence view** — link each scene to the corresponding chapter, notebook, parameters, and measurements.

## Design rule

> Never tell the viewer what the crystal can do until they have just watched it do it.
