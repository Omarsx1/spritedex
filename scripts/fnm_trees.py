#!/usr/bin/env python3
"""
Generador procedural de arboles muertos para las escenas de Fortnitemares.

Construye siluetas RELLENAS organicas (no trazos): tronco que se retuerce con
jitter de corteza, raices que se abren en la base, ramas que se bifurcan de
forma asimetrica con puntas caidas y alguna que otra rotura seca.

Salida: markup <g> listo para pegar como <defs> de
  public/fortnitemares-forest.svg        (escena apaisada)
  public/fortnitemares-forest-mobile.svg (escena vertical)
ambos usan base en (0,0) creciendo hacia -Y, alto ~300 unidades.

Uso:  python3 scripts/fnm_trees.py
Escribe los simbolos generados en .fnm-trees-generated/ para inyectarlos.
"""
import math
import random
import os

OUT_DIR = os.path.join(os.path.dirname(__file__), '..', '.fnm-trees-generated')


def segment(x, y, ang, length, w, rnd, tip_mode, curl=0.0, hook=0.0):
    """Un tramo de rama relleno: poligono con lados jittereados (corteza) y
    punta afinada o quebrada. `curl` arquea el tramo de forma persistente
    (ramas que giran, no rectas); `hook` clava la punta hacia abajo al final.
    Devuelve (poly, end_x, end_y, end_ang)."""
    steps = 4
    rad = math.radians(ang)
    dx, dy = math.sin(rad), -math.cos(rad)      # direccion (0 = arriba)
    px, py = math.cos(rad), math.sin(rad)       # perpendicular

    left, right = [], []
    cx, cy = x, y
    a = ang
    for i in range(steps):
        t = i / steps
        # la anchura se afina con el avance y tiembla como corteza
        wi = w * (1.0 - 0.62 * t) * rnd.uniform(0.9, 1.1)
        lx, ly = cx + px * wi / 2, cy + py * wi / 2
        rx, ry = cx - px * wi / 2, cy - py * wi / 2
        # rugosidad a lo largo del eje: la orilla nunca es recta
        jitter = rnd.uniform(-1.6, 1.6)
        left.append((lx + dx * jitter, ly + dy * jitter))
        right.append((rx - dx * jitter, ry - dy * jitter))
        # curvatura: deriva propia + arco persistente del tramo
        a += rnd.uniform(-3.0, 3.0) + curl
        # gancho terminal: las puntas muertas se curvan hacia abajo
        if hook and i >= steps - 2:
            a += hook * (0.6 if i == steps - 2 else 1.0)
        rad = math.radians(a)
        dx, dy = math.sin(rad), -math.cos(rad)
        px, py = math.cos(rad), math.sin(rad)
        cx, cy = cx + dx * (length / steps), cy + dy * (length / steps)

    poly = left[:]
    if tip_mode == 'break':
        # rotura seca: zigzag brusco a lo ancho de la punta
        for f in (0.34, 0.02, 0.28, -0.06):
            poly.append((cx + px * w * f * 0.5, cy + py * w * f * 0.5))
    else:
        # punta afinada con desvio
        tipx = cx + dx * w * 0.32 + rnd.uniform(-1.4, 1.4)
        tipy = cy + dy * w * 0.32 + rnd.uniform(-1.4, 1.4)
        poly.append((tipx, tipy))
    poly.extend(reversed(right))

    return poly, cx, cy, a


def branch_rec(x, y, ang, length, w, depth, rnd, polys, droop, curl=0.0):
    """Rama recursiva: se bifurca en 2-3 hijos asimetricos, las terminales
    caen hacia abajo (arbol muerto) y algunas terminan en rotura."""
    is_terminal = depth <= 1
    hook = 0.0
    if is_terminal:
        # gancho caido, hacia el lado al que apunta la rama
        hook = (1 if ang >= 0 else -1) * rnd.uniform(16, 42)
    poly, ex, ey, eang = segment(x, y, ang, length, w, rnd,
                                 tip_mode=('break' if is_terminal and rnd.random() < 0.4 else 'taper'),
                                 curl=curl, hook=hook)
    polys.append(poly)

    if depth <= 0:
        return

    n_children = 2 if rnd.random() < 0.72 else 3
    spread_lo, spread_hi = 16, 36
    if n_children == 2:
        angles = [-rnd.uniform(spread_lo, spread_hi), rnd.uniform(spread_lo, spread_hi)]
    else:
        angles = [-rnd.uniform(spread_hi, spread_hi + 18), rnd.uniform(-8, 8), rnd.uniform(spread_lo, spread_hi)]

    for off in angles:
        ca = eang + off + rnd.uniform(-4, 4)
        # las ramas altas caen: deriva hacia la horizontal
        if depth <= 2:
            ca += droop * (1 if ca < 0 else -1) * rnd.uniform(6, 26)
        ca = max(-152, min(152, ca))
        cl = length * rnd.uniform(0.52, 0.78)
        cw = w * rnd.uniform(0.46, 0.62)
        # los hijos heredan parte del arco del padre: las ramas fluyen, no se
        # quiebran en la bifurcacion
        child_curl = curl * 0.55 + rnd.uniform(-4, 4)
        # arranca un pelin dentro del padre para que no haya rendijas
        rad = math.radians(eang)
        sx = ex - math.sin(rad) * length * 0.06
        sy = ey + math.cos(rad) * length * 0.06
        branch_rec(sx, sy, ca, cl, cw, depth - 1, rnd, polys, droop, curl=child_curl)


def gen_tree(seed, H=300, W0=30, lean=0, droop=0.16, depth=4, twist=7.0):
    rnd = random.Random(seed)
    polys = []

    # raices: 4 lenguas gruesas que se abren y se hunden
    for ra in (-64, -22, 20, 62):
        root_ang = ra + rnd.uniform(-8, 8)
        rad = math.radians(root_ang)
        rl = rnd.uniform(26, 40)
        rw = W0 * rnd.uniform(0.42, 0.6)
        sx, sy = math.sin(rad) * 6, 2
        # raiz simple: cuña curvada hacia abajo
        steps = 3
        left, right = [], []
        cx, cy = sx, sy
        a = root_ang + rnd.uniform(-6, 6)
        for i in range(steps):
            t = i / steps
            wi = rw * (1 - 0.85 * t)
            px, py = math.cos(math.radians(a)), math.sin(math.radians(a))
            left.append((cx + px * wi / 2, cy + py * wi / 2))
            right.append((cx - px * wi / 2, cy - py * wi / 2))
            a += rnd.uniform(-10, 10)
            cx += math.sin(math.radians(a)) * (rl / steps)
            cy += abs(math.cos(math.radians(a))) * (rl / steps) * 0.8
        polys.append(left + [(cx, cy + 2)] + list(reversed(right)))

    # tronco con inclinacion, torsion en S y ramas que arco-ean
    trunk_h = H * 0.52
    trunk_curl = rnd.uniform(-twist, twist)
    branch_rec(0, 4, lean + rnd.uniform(-3, 3), trunk_h, W0, depth, rnd, polys, droop, curl=trunk_curl)

    return polys


def poly_to_path(polys):
    d = []
    for pts in polys:
        d.append('M' + ' L'.join(f'{x:.1f} {y:.1f}' for x, y in pts) + 'Z')
    return ''.join(d)


def symbol(name, polys):
    return f'    <g id="{name}">\n      <path d="{poly_to_path(polys)}"/>\n    </g>\n'


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    trees = {
        'fnm-treeA': gen_tree(7,  H=300, W0=30, lean=-4,  droop=0.18),
        'fnm-treeB': gen_tree(23, H=262, W0=34, lean=6,   droop=0.10, depth=3),
        'fnm-treeC': gen_tree(41, H=318, W0=26, lean=0,   droop=0.22),
        'fnm-farA':  gen_tree(59, H=150, W0=16, lean=-8,  droop=0.14, depth=3),
        'fnm-farB':  gen_tree(77, H=132, W0=18, lean=10,  droop=0.12, depth=3),
    }
    for name, polys in trees.items():
        with open(os.path.join(OUT_DIR, f'{name}.svgfrag'), 'w') as f:
            f.write(symbol(name, polys))
        n_seg = len(polys)
        print(f'{name}: {n_seg} segmentos')


if __name__ == '__main__':
    main()
