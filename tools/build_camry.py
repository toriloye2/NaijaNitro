"""Create the original NN S1 fictional sedan as an optimized game asset.

No third-party logos, meshes, downloaded imagery, or copyrighted reference
photos are embedded in the generated file. Coordinates are metres; nose faces -Z.
Run with: python tools/build_camry.py
"""
from __future__ import annotations
import math
from pathlib import Path
import numpy as np
import trimesh
from trimesh.visual.material import PBRMaterial

OUT = Path(__file__).resolve().parents[1] / 'public/vehicles/nn_s1.glb'
scene = trimesh.Scene()

def material(name, rgb, metal=0.0, rough=.5, alpha=255, emission=None):
    params = dict(name=name, baseColorFactor=[*rgb, alpha], metallicFactor=metal, roughnessFactor=rough, doubleSided=True)
    if alpha < 255:
        params['alphaMode'] = 'BLEND'
    if emission is not None:
        params['emissiveFactor'] = emission
    return PBRMaterial(**params)

PAINT = material('BodyPaint', [205,212,222],.68,.24)
GLASS = material('WindowGlass', [33,54,71],.19,.2,224)
CHROME = material('Chrome', [206,218,223],.88,.15)
DARK = material('BlackTrim', [20,26,31],.25,.53)
GRILLE = material('GrilleMesh', [17,24,31],.15,.77)
RUBBER = material('RubberTyres', [19,22,26],0,.93)
WHEEL = material('AlloyRims', [156,168,181],.78,.22)
HEADLIGHT = material('ClearHeadlight', [213,234,245],.4,.1,248, [0.05,.1,.14])
AMBER = material('AmberCorner', [243,145,40],.14,.19,252,[.12,.032,0])
TAIL = material('TailRed', [193,18,34],.22,.19,252,[.11,0,.004])
REVERSE = material('ReverseLens', [244,247,243],.1,.13)
INSIDE = material('InteriorDark', [27,32,37],.1,.8)

def add_mesh(name, vertices, faces, mat):
    geo = trimesh.Trimesh(vertices=np.array(vertices, dtype=float), faces=np.array(faces, dtype=np.int64), process=False)
    geo.visual = trimesh.visual.TextureVisuals(material=mat)
    scene.add_geometry(geo, geom_name=name, node_name=name)
    return geo

def quad(name, points, mat):
    return add_mesh(name, points, [[0,1,2],[0,2,3]], mat)

def panel(name, vertices, mat):
    faces = [[0,i,i+1] for i in range(1,len(vertices)-1)]
    return add_mesh(name,vertices,faces,mat)

def box(name, center, size, mat):
    m = trimesh.creation.box(extents=size)
    m.apply_translation(center)
    m.visual = trimesh.visual.TextureVisuals(material=mat)
    scene.add_geometry(m,geom_name=name,node_name=name)
    return m

def line(name, a, b, radius, mat, sides=6):
    a=np.array(a,dtype=float);b=np.array(b,dtype=float)
    diff=b-a
    if np.linalg.norm(diff)<1e-4: return
    mesh=trimesh.creation.cylinder(radius=radius,height=np.linalg.norm(diff),sections=sides)
    mesh.apply_transform(trimesh.geometry.align_vectors([0,0,1], diff))
    mesh.apply_translation((a+b)/2)
    mesh.visual=trimesh.visual.TextureVisuals(material=mat)
    scene.add_geometry(mesh,geom_name=name,node_name=name)

def polyline(name, points, mat, radius=.011):
    for idx in range(len(points)-1):line(f'{name}_{idx}',points[idx],points[idx+1],radius,mat)

# Curved, gently tapered three-box body, integrated bumper sections.
sections=[
    (-2.50,.78,.53,.78),(-2.37,.96,.43,.98),(-2.13,1.04,.40,1.10),
    (-1.53,1.07,.40,1.17),(-.80,1.09,.39,1.19),(.85,1.10,.39,1.19),
    (1.62,1.075,.41,1.15),(2.22,1.02,.42,1.02),(2.50,.81,.52,.81)]
# More longitudinal samples reduce the slab-like body silhouette at game distances.
# The NN S1 is intentionally fictional rather than a duplicate of any production car.
dense=[]
for i in range(len(sections)-1):
    a,b=sections[i],sections[i+1]
    for step in range(5):
        t=step/5
        t=t*t*(3-2*t)
        dense.append(tuple(a[j]+(b[j]-a[j])*t for j in range(4)))
dense.append(sections[-1])
sections=dense
verts=[]
for z,w,bottom,top in sections:
    verts.extend([
        [-w*.83,bottom,z],[-w,bottom+.13,z],[-w,top-.02,z],[-w*.68,top+.03,z],
        [0,top+.055,z],[w*.68,top+.03,z],[w,top-.02,z],[w,bottom+.13,z],[w*.83,bottom,z]])
N=9; faces=[]
for i in range(len(sections)-1):
    for j in range(N-1):
        a=i*N+j;b=(i+1)*N+j
        faces.extend([[a,b,a+1],[a+1,b,b+1]])
faces.extend([[0,j+1,j] for j in range(N-2)])
k=(len(sections)-1)*N
faces.extend([[k,k+j,k+j+1] for j in range(1,N-1)])
add_mesh('BodyPaint_SculptedBody',verts,faces,PAINT)
for side in (-1,1):
    polyline(f'BodyPaint_Shoulder_{side}',[[side*.94,1.17,-1.43],[side*1.09,1.16,-.71],[side*1.095,1.14,.6],[side*1.065,1.13,1.52]],PAINT,.017)
    polyline(f'DoorCutFront_{side}',[[side*1.085,1.13,-.19],[side*1.094,.85,-.17],[side*1.09,.53,-.16]],DARK,.010)
    polyline(f'DoorCutRear_{side}',[[side*1.08,1.13,1.44],[side*1.08,.83,1.45],[side*1.075,.54,1.44]],DARK,.010)
    box(f'DoorHandleFront_{side}',(side*1.105,1.025,-.58),(.11,.062,.31),CHROME)
    box(f'DoorHandleRear_{side}',(side*1.105,1.025,.87),(.11,.062,.31),CHROME)
    box(f'BodyPaint_Mirror_{side}',(side*1.12,1.22,-.98),(.30,.18,.34),PAINT)
    box(f'MirrorGlass_{side}',(side*1.277,1.225,-.98),(.024,.11,.24),GLASS)
    box(f'SideSkirt_{side}',(side*1.072,.445,0),(.045,.1,3.35),DARK)

# Roof arch with inclined windscreens and four-door side windows.
roof=[(-1.13,1.18,.97),(-.55,1.88,.835),(.71,1.875,.835),(1.53,1.17,1.025)]
roof_verts=[]
for z,y,w in roof:
    roof_verts.extend([[-w,1.17,z],[-w,y,z],[w,y,z],[w,1.17,z]])
roof_faces=[]
for i in range(len(roof)-1):
    for j in range(4):
        a=i*4+j;b=(i+1)*4+j;c=i*4+(j+1)%4;d=(i+1)*4+(j+1)%4
        roof_faces.extend([[a,b,c],[c,b,d]])
add_mesh('BodyPaint_RoofAndPillars',roof_verts,roof_faces,PAINT)
quad('WindowGlass_Windscreen',[(-.817,1.845,-.57),(.817,1.845,-.57),(.956,1.215,-1.107),(-.956,1.215,-1.107)],GLASS)
quad('WindowGlass_RearWindow',[(-.818,1.833,.733),(-.96,1.215,1.49),(.96,1.215,1.49),(.818,1.833,.733)],GLASS)
quad('BodyPaint_RoofCentre',[(-.817,1.882,-.53),(.817,1.882,-.53),(.817,1.879,.70),(-.817,1.879,.70)],PAINT)
for s in (-1,1):
    quad(f'WindowGlass_FrontSide_{s}',[(s*.976,1.215,-1.078),(s*.825,1.827,-.532),(s*.834,1.827,.042),(s*1.00,1.216,.042)],GLASS)
    quad(f'WindowGlass_RearSide_{s}',[(s*.837,1.827,.082),(s*.827,1.819,.69),(s*.972,1.211,1.442),(s*1.0,1.215,.082)],GLASS)
    polyline(f'Chrome_WindowTrim_{s}',[(s*.978,1.225,-1.1),(s*.839,1.865,-.54),(s*.844,1.866,.71),(s*.999,1.215,1.48)],CHROME,.016)
    polyline(f'Black_BPillar_{s}',[(s*.839,1.857,.065),(s*1.008,1.22,.065)],DARK,.039)
    polyline(f'Chrome_Belt_{s}',[(s*.994,1.211,-1.08),(s*1.01,1.206,.05),(s*.999,1.209,1.445)],CHROME,.015)

# Original NN S1 grille, swept headlights, lower intakes and fog accents.
quad('GrilleMesh_Front',[(-.68,.73,-2.522),(.68,.73,-2.522),(.80,1.007,-2.435),(-.80,1.007,-2.435)],GRILLE)
polyline('Chrome_GrilleOutline',[(-.68,.73,-2.531),(-.80,1.008,-2.443),(0,1.065,-2.467),(.80,1.008,-2.443),(.68,.73,-2.531)],CHROME,.038)
for i in range(5):
    z=-2.536+i*.008
    line(f'Chrome_GrilleBar_{i}',(-.61+i*.025,.78+i*.044,z),(.61-i*.025,.78+i*.044,z),.014,CHROME)
for s in (-1,1):
    quad(f'HeadlightLens_{s}',[(s*.64,1.055,-2.455),(s*1.009,1.078,-2.34),(s*1.072,1.151,-1.96),(s*.81,.958,-2.444)],HEADLIGHT)
    panel(f'AmberCorner_{s}',[(s*.99,1.071,-2.34),(s*1.064,1.147,-2.04),(s*.951,1.062,-2.32)],AMBER)
    box(f'BlackFogSurround_{s}',(s*.82,.565,-2.475),(.35,.15,.06),GRILLE)
    box(f'ChromeFogLens_{s}',(s*.82,.565,-2.512),(.23,.092,.025),CHROME)
quad('LowerGrille',[(-.71,.49,-2.504),(.71,.49,-2.504),(.65,.66,-2.51),(-.65,.66,-2.51)],GRILLE)
box('LicencePlateFront',(0,.83,-2.551),(.49,.135,.028),REVERSE)
# Rear cluster with separate red and reversing lights.
for s in (-1,1):
    quad(f'TailRed_{s}',[(s*.41,1.09,2.48),(s*1.0,1.068,2.336),(s*.96,.85,2.489),(s*.43,.87,2.535)],TAIL)
    quad(f'ReverseLens_{s}',[(s*.433,1.01,2.538),(s*.85,.992,2.489),(s*.83,.93,2.503),(s*.445,.946,2.54)],REVERSE)
box('ChromeBootTrim',(0,.97,2.54),(.94,.1,.04),CHROME)
box('LicencePlateRear',(0,.78,2.567),(.52,.17,.029),REVERSE)
box('RearLowerBumper',(0,.57,2.532),(1.45,.16,.07),PAINT)
box('ExhaustOutlet',(.66,.47,2.56),(.23,.085,.1),DARK)

# Four alloy wheels with concentric rims and individual polished spokes.
for side in (-1,1):
  for axle,zz in [('Front',-1.49),('Rear',1.53)]:
    prefix=f'Wheel_{axle}_{"R" if side>0 else "L"}'
    xx=side*1.07
    tire=trimesh.creation.cylinder(radius=.445,height=.29,sections=28)
    tire.apply_transform(trimesh.transformations.rotation_matrix(math.pi/2,[0,1,0]))
    tire.apply_translation([xx,.48,zz])
    tire.visual=trimesh.visual.TextureVisuals(material=RUBBER)
    scene.add_geometry(tire,geom_name=f'{prefix}_Tyre',node_name=f'{prefix}_Tyre')
    surface_x=xx+side*.16
    rim=trimesh.creation.cylinder(radius=.306,height=.02,sections=24)
    rim.apply_transform(trimesh.transformations.rotation_matrix(math.pi/2,[0,1,0]))
    rim.apply_translation([surface_x,.48,zz]);rim.visual=trimesh.visual.TextureVisuals(material=WHEEL)
    scene.add_geometry(rim,geom_name=f'{prefix}_Alloy',node_name=f'{prefix}_Alloy')
    for i in range(10):
        a=i*math.pi/5
        yy=.48+math.cos(a)*.19
        z=zz+math.sin(a)*.19
        b=box(f'{prefix}_Spoke_{i}',(surface_x+side*.018, yy, z),(.03,.12,.041),CHROME)
        b.apply_transform(trimesh.transformations.rotation_matrix(-a,[1,0,0],point=[surface_x+side*.018,yy,z]))
    box(f'{prefix}_Hub',(surface_x+side*.027,.48,zz),(.04,.095,.095),CHROME)

# Original NN S1 identity details: a floating front signature blade, three-point
# accent lights, branded racing number panel, and lower diffuser. Avoids OEM badges.
CYAN_ACCENT = material('NN_AccentCyan', [31,205,230],.28,.23,255,[.01,.14,.18])
CARBON = material('NN_Carbon', [24,31,37],.38,.43)
for side in (-1,1):
    polyline(f'NN_SignatureHeadlight_{side}',[
        [side*.66,1.065,-2.467],[side*.84,1.087,-2.426],[side*1.04,1.159,-2.02]
    ],CYAN_ACCENT,.022)
    line(f'NN_DiffuserFin_{side}',
        (side*.69,.46,2.568),(side*.75,.65,2.553),.04,CARBON)
    polyline(f'NN_TaillightAccent_{side}',[
        [side*.46,1.108,2.485],[side*.82,1.108,2.401],[side*.985,1.073,2.344]
    ],CYAN_ACCENT,.016)
box('NN_FrontSplitter',(0,.405,-2.43),(1.64,.065,.36),CARBON)
box('NN_RearDiffuser',(0,.39,2.45),(1.56,.07,.29),CARBON)
box('NN_FrontAccentBlade',(0,.685,-2.57),(1.07,.035,.055),CYAN_ACCENT)
box('NN_RearAccentBlade',(0,.72,2.61),(.42,.024,.06),CYAN_ACCENT)

OUT.parent.mkdir(parents=True,exist_ok=True)
blob=scene.export(file_type='glb')
OUT.write_bytes(blob)
print(f'Wrote {OUT} ({len(blob):,} bytes) with {len(scene.geometry)} scene meshes')
if len(blob) > 2_000_000:
    raise RuntimeError('Car asset exceeded the 2 MB performance budget')
