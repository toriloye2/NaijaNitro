"""NN Street S1: original high-detail procedural browser-racing sedan.

Build: pip install numpy==2.1.3 trimesh==4.11.1
       python tools/build_nn_s1.py
The silhouette, grille, trim, lighting and badging are fictional Naija Nitro
designs, not a licensed or exact copy of a real manufacturer's vehicle.
"""
from __future__ import annotations
import math
from pathlib import Path

import numpy as np
import trimesh
from trimesh.visual.material import PBRMaterial

OUT = Path(__file__).resolve().parents[1] / "public/vehicles/nn_s1.glb"
scene = trimesh.Scene()
COUNTER = 0

def mat(name, rgb, metallic=.0, roughness=.5, alpha=255, emissive=None):
    kw = dict(name=name, baseColorFactor=[*rgb, alpha],
              metallicFactor=metallic, roughnessFactor=roughness, doubleSided=True)
    if alpha < 255: kw["alphaMode"] = "BLEND"
    if emissive is not None: kw["emissiveFactor"] = emissive
    return PBRMaterial(**kw)

PAINT = mat("NN_S1_GlacierSilver", [191,205,218], .83, .20)
PAINT_DARK = mat("NN_S1_CarbonLower", [25,36,44], .35, .32)
GLASS = mat("NN_S1_WindowTint", [31,49,64], .23, .15, 248)
GLASS_DARK = mat("NN_S1_DarkTint", [17,31,42], .2, .18)
CHROME = mat("NN_S1_Chrome", [204,213,220], .92, .13)
SILVER = mat("NN_S1_SatinMetal", [145,159,171], .72, .29)
TIRE = mat("NN_S1_Rubber", [18,21,26], 0, .98)
GRILLE = mat("NN_S1_Mesh", [12,18,24], .15, .65)
INNER = mat("NN_S1_Interior", [29,36,44], .08, .81)
LEATHER = mat("NN_S1_Seat", [51,59,66], .0, .85)
LED = mat("NN_S1_FrostLED", [194,244,250], .18, .1, 255, [.11,.18,.2])
BLUE = mat("NN_S1_CyanSignature", [38,214,246], .25, .12, 255,[.02,.29,.4])
RED = mat("NN_S1_RedTail", [202,21,38], .21, .17, 255,[.22,.0,.007])
AMBER = mat("NN_S1_Amber", [255,153,41], .1, .22, 255,[.1,.035,0])
BRAKE = mat("NN_S1_BrakeCaliper", [212,44,38], .4, .27)
PLATE = mat("NN_S1_Plate", [220,235,231], .0, .53)

def put(name, geometry, material):
    global COUNTER
    COUNTER += 1
    geometry.visual = trimesh.visual.TextureVisuals(material=material)
    scene.add_geometry(geometry, geom_name=name, node_name=name)
    return geometry

def mesh(name, verts, faces, material):
    return put(name, trimesh.Trimesh(vertices=np.asarray(verts,dtype=float),
                                    faces=np.asarray(faces,dtype=np.int64),
                                    process=False), material)

def face(name, vertices, material):
    return mesh(name, vertices, [[0,i,i+1] for i in range(1,len(vertices)-1)], material)

def box(name, center, dims, material):
    geo=trimesh.creation.box(extents=dims)
    geo.apply_translation(center)
    return put(name,geo,material)

def cyl(name, radius, length, center, material, segments=24, direction="x"):
    geo=trimesh.creation.cylinder(radius=radius,height=length,sections=segments)
    if direction=="x":
        geo.apply_transform(trimesh.transformations.rotation_matrix(math.pi/2,[0,1,0]))
    geo.apply_translation(center)
    return put(name,geo,material)

def path(name, points, material, radius=.012, segments=8):
    for i,(a,b) in enumerate(zip(points[:-1],points[1:])):
        a,b=np.asarray(a,float),np.asarray(b,float)
        delta=b-a
        if np.linalg.norm(delta)<.0001:continue
        geo=trimesh.creation.cylinder(radius=radius,height=np.linalg.norm(delta),sections=segments)
        geo.apply_transform(trimesh.geometry.align_vectors([0,0,1],delta))
        geo.apply_translation((a+b)*.5)
        put(f"{name}_{i:02d}",geo,material)

def interpolate(profile, divisions=7):
    out=[]
    for a,b in zip(profile[:-1],profile[1:]):
        for i in range(divisions):
            t=i/divisions
            t=t*t*(3-2*t)
            out.append(tuple(a[j]*(1-t)+b[j]*t for j in range(len(a))))
    out.append(profile[-1])
    return out

# Rounded 5.08m four-door sports sedan, with swept fenders and lower rocker.
# Control points: (z, halfwidth, lower body y, upper shoulder y).
profile=[
    (-2.56,.67,.52,.77),(-2.43,.91,.43,.92),(-2.15,1.015,.39,1.047),
    (-1.54,1.085,.39,1.15),(-.94,1.10,.4,1.205),
    (.30,1.095,.40,1.213), (1.32,1.081,.40,1.176),
    (1.93,1.056,.41,1.100), (2.38,.93,.47,.99),(2.54,.73,.55,.86)
]
cross=[
    (0,1.0),(.19,1.012),(.48,1.003),(.70,.983),
    (.84,.947),(.96,.845),(1.018,.70),(1.021,.50),
    (.986,.24),(.91,.087),(.70,0),(.36,-.045),
    (0,-.055)
]
# Across one ring: center hood -> right side -> bottom -> left side -> top.
contour=cross + [(-x,y) for x,y in cross[-2:0:-1]]
profile=interpolate(profile,9)
vertices=[]
for z,w,low,top in profile:
    for nx,ny in contour:
        vertices.append([nx*w,low+(top-low)*ny,z])
n=len(contour); indices=[]
for ring in range(len(profile)-1):
    for j in range(n):
        a=ring*n+j
        b=(ring+1)*n+j
        c=(ring+1)*n+(j+1)%n
        d=ring*n+(j+1)%n
        indices.extend([[a,b,d],[d,b,c]])
# Covers front and rear; body is closed.
for j in range(1,n-1):
    indices.append([0,j+1,j])
    start=(len(profile)-1)*n
    indices.append([start,start+j,start+j+1])
mesh("BodyPaint_CurvedUnibody",vertices,indices,PAINT)

# Fenders, shoulder creases and four subtly defined door panels.
for side in (-1,1):
    path(f"BodyPaint_Shoulder_{side}",[
        [side*.83,1.05,-2.40],[side*1.045,1.178,-1.47],
        [side*1.092,1.216,-.8],[side*1.075,1.18,1.35],
        [side*.96,1.02,2.31]],PAINT,.012)
    for z in (-.16,1.40):
        path(f"Body_PanelCut_{side}_{z}",[
            [side*1.095,1.15,z],[side*1.12,.91,z],
            [side*1.102,.60,z]],GRILLE,.006)
    path(f"Body_ChromeLower_{side}",[
        [side*1.077,.57,-1.26],[side*1.105,.55,-.4],
        [side*1.099,.56,1.3]],SILVER,.009)
    box(f"BodyPaint_Mirror_{side}",[side*1.12,1.21,-.98],[.29,.17,.31],PAINT)
    box(f"Window_Mirror_{side}",[side*1.28,1.22,-.98],[.015,.105,.21],GLASS_DARK)
    for z in (-.47,.92):
        box(f"Chrome_DoorHandle_{side}_{z}",[side*1.12,1.07,z],[.10,.048,.29],CHROME)
    box(f"CarbonSideSkirt_{side}",[side*1.03,.42,0],[.14,.075,3.47],PAINT_DARK)

# Sloping coupe-influenced roof, without a box silhouette.
# (z, y top, width near roof, width at belt)
roof=[
    (-1.16,1.21,.97,1.03),(-1.02,1.45,.915,1.04),
    (-.70,1.77,.85,1.06),(-.52,1.825,.825,1.06),
    (.04,1.847,.83,1.06),(.55,1.817,.84,1.06),
    (.83,1.77,.86,1.055),(1.25,1.37,.966,1.045),
    (1.51,1.18,1.045,1.045)
]
roof=interpolate(roof,5)
top_points=[]
roof_verts=[]
for z,y,topwidth,beltwidth in roof:
    roof_verts.extend([[-beltwidth,1.203,z],[-topwidth,y,z],[0,y+.028,z],
                       [topwidth,y,z],[beltwidth,1.203,z]])
tri=[]
for i in range(len(roof)-1):
    for j in range(4):
        a=i*5+j;b=(i+1)*5+j
        tri.extend([[a,b,a+1],[a+1,b,b+1]])
mesh("BodyPaint_SculptedRoof",roof_verts,tri,PAINT)
# The windows are layered on slanted roof surfaces and surrounded by thick trim.
face("WindowGlass_Windscreen",[
    [-.968,1.22,-1.15],[.968,1.22,-1.15],
    [.842,1.782,-.687],[-.842,1.782,-.687]],GLASS)
face("WindowGlass_RearWindshield",[
    [-.845,1.775,.83],[.845,1.775,.83],
    [.978,1.22,1.48],[-.978,1.22,1.48]],GLASS)
for side in (-1,1):
    face(f"WindowGlass_FrontDoor_{side}",[
        [side*.99,1.223,-1.09],[side*.851,1.765,-.69],
        [side*.838,1.807,.02],[side*1.063,1.227,.02]],GLASS)
    face(f"WindowGlass_RearDoor_{side}",[
        [side*.838,1.806,.10],[side*.856,1.756,.76],
        [side*.976,1.238,1.46],[side*1.064,1.225,.10]],GLASS)
    path(f"Chrome_WindowSurround_{side}",[
        [side*.99,1.22,-1.1],[side*.85,1.78,-.69],
        [side*.833,1.84,-.51],[side*.839,1.84,.52],
        [side*.855,1.78,.82],[side*.983,1.218,1.49]],CHROME,.014)
    path(f"WindowBelt_{side}",[
        [side*.996,1.214,-1.11],[side*1.06,1.22,.04],
        [side*.997,1.216,1.47]],GRILLE,.020)
    path(f"WindowBPillar_{side}",[[side*.84,1.834,.06],[side*1.064,1.228,.065]],GRILLE,.029)

# Dark cabin, driver seating and headrests visible through tinted windows.
for side in (-1,1):
    for z in (-.25,.86):
        box(f"Interior_SeatBase_{side}_{z}",[side*.43,.88,z],[.58,.18,.72],INNER)
        box(f"Interior_SeatBack_{side}_{z}",[side*.43,1.26,z+.21],[.56,.72,.19],LEATHER)
        box(f"Interior_Headrest_{side}_{z}",[side*.43,1.65,z+.23],[.31,.22,.15],INNER)
box("Interior_Dashboard",[0,1.14,-.94],[1.81,.16,.35],INNER)
# Distinctive sporty dashboard cluster.
cyl("Interior_SteeringWheel",.23,.04,[.43,1.28,-.78],GRILLE,24,"x")

# Original hexagon grille and mesh (no real-world manufacturer badge).
grille_shape=[[-.67,.70,-2.568],[.67,.70,-2.568],
              [.91,1.00,-2.48],[0,1.085,-2.485],[-.91,1.00,-2.48]]
face("GrilleMesh_Main",grille_shape,GRILLE)
path("Chrome_GrilleEdge",grille_shape+[grille_shape[0]],CHROME,.026)
for row in range(5):
    y=.75+row*.05
    half=.59+.06*row
    for col in range(11):
        x=(col-5)*half/5
        cyl(f"Grille_Honeycomb_{row}_{col}",.016,.018,[x,y,-2.577+.02*row],SILVER,6,"x")
box("NN_FrontAirIntake",[0,.53,-2.55],[1.55,.16,.05],GRILLE)
box("NN_FrontSplitter",[0,.405,-2.45],[1.74,.072,.3],PAINT_DARK)
for side in (-1,1):
    # Swept-back lamp housings with 2 distinct projectors and cyan LED strips.
    outline=[
        [side*.59,1.065,-2.488],
        [side*.92,1.10,-2.37],
        [side*1.059,1.19,-1.94],
        [side*.96,1.008,-2.384]
    ]
    face(f"HeadlightOuter_{side}",outline,GRILLE)
    lens=[[p[0]*.996,p[1]+.008,p[2]-.009] for p in outline]
    face(f"HeadlightLens_{side}",lens,LED)
    path(f"NN_SignatureLED_{side}",[
        [side*.60,1.078,-2.50],[side*.86,1.115,-2.404],
        [side*1.065,1.202,-1.967]],BLUE,.019)
    face(f"FrontIndicator_{side}",[
        [side*.965,1.109,-2.347],[side*1.052,1.183,-1.977],
        [side*.970,1.06,-2.339]],AMBER)
    box(f"FogHousing_{side}",[side*.78,.583,-2.5],[.41,.175,.05],GRILLE)
    box(f"FogLamp_{side}",[side*.77,.584,-2.533],[.22,.072,.04],LED)
    box(f"NN_Vent_{side}",[side*.947,.52,-2.346],[.1,.12,.1],GRILLE)
box("NN_FrontNumberPlate",[0,.81,-2.58],[.5,.13,.035],PLATE)
box("NN_FrontBadge",[0,1.055,-2.523],[.18,.075,.028],BLUE)

# Angular wraparound rear lamp cluster and double lower diffuser.
for side in (-1,1):
    pts=[[side*.43,1.096,2.5],[side*.997,1.055,2.33],
         [side*.965,.86,2.495],[side*.42,.875,2.57]]
    face(f"TailRed_{side}",pts,RED)
    face(f"ReverseLens_{side}",[
        [side*.44,1.014,2.566],[side*.835,1.0,2.51],
        [side*.81,.945,2.54],[side*.448,.948,2.576]],LED)
    path(f"NN_RearLightBar_{side}",[
        [side*.43,1.106,2.517],[side*.79,1.102,2.42],
        [side*.984,1.06,2.348]],BLUE,.016)
    box(f"NN_RearDiffuserFin_{side}",[side*.68,.39,2.52],[.085,.21,.24],PAINT_DARK)
box("Chrome_RearDeckTrim",[0,.99,2.57],[.96,.07,.055],CHROME)
box("NN_RearNumberPlate",[0,.76,2.603],[.51,.17,.04],PLATE)
box("NN_RearDiffuser",[0,.39,2.47],[1.57,.085,.29],PAINT_DARK)
box("NN_RearBlade",[0,.72,2.63],[.63,.035,.055],BLUE)
for side in (-1,1):
    cyl(f"NN_DualExhaust_{side}",.10,.14,[side*.64,.48,2.63],CHROME,16,"x")
# Subtle ducktail rather than a brand-specific spoiler.
path("BodyPaint_Ducktail",[[-.83,1.04,2.32],[0,1.087,2.48],[.83,1.04,2.32]],PAINT,.027)

# Layered sport alloys, disc brakes, red calipers and tyre sidewalls.
for side in (-1,1):
    for axle,z in [("Front",-1.50),("Rear",1.53)]:
        key=f"Wheel_{axle}_{'R' if side>0 else 'L'}"
        cx=side*1.079
        cy=.48
        cyl(key+"_Rubber",.462,.30,[cx,cy,z],TIRE,40)
        exposed=cx+side*.168
        cyl(key+"_BrakeDisc",.327,.024,[exposed,cy,z],SILVER,32)
        cyl(key+"_Rim",.315,.038,[exposed+side*.02,cy,z],CHROME,40)
        cyl(key+"_SpokeBackplate",.276,.048,[exposed+side*.047,cy,z],GRILLE,40)
        cyl(key+"_Hub",.087,.064,[exposed+side*.09,cy,z],CHROME,20)
        # Radially distributed metallic tapered spokes with physically separate highlights.
        for i in range(10):
            a=i*math.tau/10
            y0=cy+math.cos(a)*.09
            z0=z+math.sin(a)*.09
            y1=cy+math.cos(a)*.275
            z1=z+math.sin(a)*.275
            path(key+f"_Spoke_{i}",[
                [exposed+side*.077,y0,z0],
                [exposed+side*.075,y1,z1]],CHROME,.033,6)
        box(key+"_Caliper",[exposed-side*.026,cy+.20,z+.18],[.04,.145,.13],BRAKE)
        # Sidewall text/tread is purposefully original, without tire brand names.
        for i in range(20):
            a=i*math.tau/20
            yy=cy+.448*math.cos(a)
            zz=z+.448*math.sin(a)
            box(key+f"_Tread_{i}",[cx,yy,zz],[.27,.022,.055],TIRE)

OUT.parent.mkdir(parents=True,exist_ok=True)
binary=scene.export(file_type="glb")
OUT.write_bytes(binary)
print(f"Generated {OUT}: {len(binary)} bytes, {len(scene.geometry)} meshes")
if len(binary) > 2_500_000: raise RuntimeError("Vehicle asset exceeds 2.5 MB budget")
if len(scene.geometry) < 150: raise RuntimeError("Insufficient model detail")
