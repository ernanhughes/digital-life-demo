# Digital Life Demo

Interactive companion for **Digital Life From First Principles**.

The goal is to turn the book's experimental argument into one continuous, explorable demonstration: a viewer should be able to watch the digital crystal persist, perturb it, damage it, give it a history, and inspect the evidence behind each effect.

## Current milestone: first canonical scientific replay

The browser now contains its first claim-bearing replay from the book rather than a hand-authored visual effect.

The **Intervene** scene replays the finite-budget redistribution experiment that appears in the current manuscript as Chapter 14, *Can Finite Computation Couple Distant Events?*

It uses:

- the representative frozen crystal selected by the canonical visualization script,
- representative seed `2502`,
- the actual intervention cell `x = (8, -8)`,
- the real PREVENT/FORCE frontier sets,
- the real `f = 0.25`, `B = 17` evaluated-candidate sets,
- the real far-field selector swaps for that representative state,
- the frozen aggregate result `mean E_far = -0.2614` for the FCP `+2` class (`n = 384` groups),
- and the full-evaluation hard-zero control (`E_far = 0`, `PASS`).

The underlying research lineage remains Chapter 25 in the experiment scripts because the manuscript was later compressed and reordered; the same result is now presented in current Chapter 14.

### Scientific boundary

Only the **Intervene** scene is currently a canonical scientific replay.

**Observe**, **Damage**, and **History** still use development fixtures. They are intentionally labelled as prototypes in the UI until their own canonical replay exports are connected.

Representative geometry and aggregate measurements are also kept distinct: the displayed checkpoint/selector membership comes from one deterministic representative state, while `E_far` is the aggregate frozen result across the experiment groups. The UI must not imply that the aggregate mean is the single representative state's measured value.

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
validated replay contract
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

The browser is a **scientific replay engine**, not an animation that invents results. Every claim-bearing visual state must be traceable to a named experiment, run, parameters, and measured output.

## Replay data contract

The first replay is checked in at:

```text
src/data/ch14-finite-budget-redistribution.json
```

It records five distinct kinds of information:

1. **Provenance** — source repository, experiment script, visualization script, current manuscript chapter, seed and parameters.
2. **Checkpoint geometry** — the occupied axial hex coordinates of the representative frozen crystal.
3. **Intervention/frontier state** — focal cell, causal radius, PREVENT frontier and FORCE frontier.
4. **Selector state** — finite budget, selected candidate sets, and far-field swapped-in/swapped-out cells.
5. **Measurements** — aggregate `E_far`, confidence interval, group count, low-budget scaling status and the full-evaluation hard-zero control.

`src/replay.ts` validates the schema boundary before the renderer receives the data.

## Planned story

1. **Formation / persistence** — establish the ongoing process.
2. **Damage / return** — remove material and measure what returns.
3. **History** — create two similar present states with different pasts.
4. **Same intervention, different future** — demonstrate causal history dependence.
5. **Material turnover** — replace substrate while tracking process continuity.
6. **Finite-budget redistribution** — **first canonical replay now connected**.
7. **Evidence view** — link each scene to the corresponding chapter, notebook, parameters, and measurements.

The next replay milestone should move earlier in the book and connect **formation/persistence** so the demo can begin building the book's argument in narrative order.

## Design rule

> Never tell the viewer what the crystal can do until they have just watched it do it.
