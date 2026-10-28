"""Build original Naija Nitro NN Street S1 in real Blender.
Generated with bpy, edited as .blend and exported as runtime .glb.
Coordinates are x-width, y-up, z-front/back in game. Nose is -z.
No third-party car artwork or marks are embedded.
Usage: blender --background --python tools/build_nn_s1_blender.py
"""
from pathlib import Path
import math
import bpy
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[1]
GLB=ROOT/'public/vehicles/nn_s1.glb'
BLEND=ROOT/'assets/blender/nn_s1.blend'
FRONT=ROOT/'public/previews/nn_s1_front.png'
REAR=ROOT/'public/previews/nn_s1_rear.png'
for p in [GLB,BLEND,FRONT,REAR]:p.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
cars=[]
def V(x,y,z):return Vector((x,-z,y))
def P(pt):return V(*pt)

def mat(name,col,metal=0,rough=.5,coat=0,emit=None,alpha=1):
    m=bpy.data.materials.new(name);m.diffuse_color=(*col,alpha);m.use_nodes=True
    n=m.node_tree.nodes.get('Principled BSDF')
    n.inputs['Base Color'].default_value=(*col,1)
    n.inputs['Metallic'].default_value=metal
    n.inputs['Roughness'].default_value=rough
    if 'Coat Weight' in n.inputs:n.inputs['Coat Weight'].default_value=coat
    if 'Coat Roughness' in n.inputs:n.inputs['Coat Roughness'].default_value=.15
    if emit:
        n.inputs['Emission Color'].default_value=(*emit,1)
        n.inputs['Emission Strength'].default_value=2.0
    if alpha<1:
        n.inputs['Alpha'].default_value=alpha
        if hasattr(m,'surface_render_method'):m.surface_render_method='DITHERED'
        elif hasattr(m,'blend_method'):m.blend_method='BLEND'
    return m

PAINT=mat('BodyPaint_IceSilver',(.59,.66,.74),.8,.22,.7)
DARK=mat('NN_Carbon',(.019,.027,.035),.3,.38)
GLASS=mat('Glass_Tinted',(.074,.15,.21),.24,.16,.25,alpha=.82)
PILLAR=mat('PillarBlack',(.012,.019,.026),.16,.4)
CHROME=mat('Chrome',(.77,.83,.86),.91,.12)
RIM=mat('NN_Aluminum',(.53,.60,.65),.85,.22)
RUBBER=mat('Rubber',(.014,.017,.02),0,.9)
MESH=mat('NN_Honeycomb',(.022,.031,.039),.3,.5)
LED=mat('Headlight_LED',(.69,.88,.99),.2,.15,.65,emit=(.3,.66,1))
CYAN=mat('NN_ElectricSignature',(.028,.67,.83),.32,.18,.3,emit=(.02,.36,.57))
RED=mat('NN_Taillight',(.7,.01,.035),.32,.18,.55,emit=(.45,.008,.012))
AMBER=mat('Indicators',(.9,.4,.016),.22,.22,emit=(.8,.16,.0))
REVERSE=mat('RearWhite',(.71,.8,.86),.18,.15,.5)
BRAKE=mat('BrakeRed',(.65,.06,.045),.62,.32)
INTERIOR=mat('DashGraphite',(.025,.037,.046),.03,.84)
SEAT=mat('SeatFabric',(.13,.16,.18),.03,.83)
PLATE=mat('NN_Plate',(.72,.82,.77),.05,.54)

def register(obj,name,m,bevel=0,smooth=False):
    obj.name=name;obj.data.materials.clear();obj.data.materials.append(m)
    if bevel:
        b=obj.modifiers.new('Beveled edges','BEVEL');b.width=bevel;b.segments=3
        if hasattr(b,'affect'):b.affect='EDGES'
        n=obj.modifiers.new('Weighted normals','WEIGHTED_NORMAL');n.keep_sharp=True
    if smooth:
        for polygon in obj.data.polygons:polygon.use_smooth=True
    cars.append(obj);return obj
def mesh(name,pts,faces,m,smooth=False):
    d=bpy.data.meshes.new(name);d.from_pydata([P(p) for p in pts],[],faces);d.update()
    o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o)
    return register(o,name,m,smooth=smooth)
def patch(name,pts,m):return mesh(name,pts,[tuple(range(len(pts)))],m)
def box(name,center,size,m,bevel=0):
    bpy.ops.mesh.primitive_cube_add(size=1,location=P(center));o=bpy.context.object
    o.dimensions=(size[0],size[2],size[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return register(o,name,m,bevel=bevel)
def cyl(name,center,radius,depth,m,segments=32):
    bpy.ops.mesh.primitive_cylinder_add(vertices=segments,radius=radius,depth=depth,location=P(center))
    o=bpy.context.object;o.rotation_euler[1]=math.pi/2
    return register(o,name,m,smooth=True)
def torus(name,center,major,minor,m):
    bpy.ops.mesh.primitive_torus_add(major_segments=48,minor_segments=12,location=P(center),major_radius=major,minor_radius=minor)
    o=bpy.context.object;o.rotation_euler[1]=math.pi/2
    return register(o,name,m,smooth=True)
def curve(name,pts,r,m):
    d=bpy.data.curves.new(name,'CURVE');d.dimensions='3D';d.resolution_u=18;d.bevel_depth=r;d.bevel_resolution=3
    sp=d.splines.new('BEZIER');sp.bezier_points.add(len(pts)-1)
    for b,p in zip(sp.bezier_points,pts):
        b.co=P(p);b.handle_left_type='AUTO';b.handle_right_type='AUTO'
    o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o)
    bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
    bpy.ops.object.convert(target='MESH');return register(bpy.context.object,name,m,smooth=True)
def loft_profile(profile,steps=7):
    out=[]
    for a,b in zip(profile[:-1],profile[1:]):
        for j in range(steps):
            t=j/steps;t=t*t*(3-2*t)
            out.append(tuple(a[k]*(1-t)+b[k]*t for k in range(len(a))))
    out.append(profile[-1]);return out

# Lofts use 7,000+ curved surface vertices, not a collection of rectangular boxes.
profile=[
 (-2.57,.67,.53,.76),(-2.46,.88,.46,.87),(-2.22,1.03,.40,1.06),
 (-1.71,1.084,.41,1.15),(-1.22,1.105,.42,1.20),(-.50,1.114,.42,1.21),
 (.30,1.108,.43,1.22),(1.12,1.098,.42,1.19),
 (1.76,1.062,.42,1.13),(2.26,.98,.47,1.04),(2.48,.81,.53,.89),(2.57,.67,.59,.81)]
contour=[
 (0,1),(.25,1.004),(.5,.995),(.73,.97),(.87,.92),(.97,.78),
 (1,.58),(.996,.39),(.94,.19),(.81,.04),(.59,-.01),(.27,-.04),
 (0,-.045),(-.27,-.04),(-.59,-.01),(-.81,.04),(-.94,.19),
 (-.996,.39),(-1,.58),(-.97,.78),(-.87,.92),(-.73,.97),
 (-.5,.995),(-.25,1.004)]
profile=loft_profile(profile,10);vs=[];fs=[];N=len(contour)
for z,w,lo,top in profile:
    for x,y in contour:vs.append((x*w,lo+(top-lo)*y,z))
for i in range(len(profile)-1):
    for j in range(N):
        a=i*N+j;b=(i+1)*N+j;c=(i+1)*N+(j+1)%N;d=i*N+(j+1)%N
        fs.extend(((a,b,d),(d,b,c)))
for j in range(1,N-1):fs.append((0,j+1,j))
last=(len(profile)-1)*N
for j in range(1,N-1):fs.append((last,last+j,last+j+1))
body=mesh('BodyPaint_CurvedUnibody',vs,fs,PAINT,smooth=True)
# Cut actual arches so wheels do not merely float outside a box.
for axle,z in [('Front',-1.52),('Rear',1.52)]:
    temp=cyl('TEMP_Arch_'+axle,(0,.49,z),.538,3.5,INTERIOR,48)
    bm=body.modifiers.new('Wheel well '+axle,'BOOLEAN')
    bm.operation='DIFFERENCE';bm.solver='EXACT';bm.object=temp
    bpy.ops.object.select_all(action='DESELECT');body.select_set(True);bpy.context.view_layer.objects.active=body
    bpy.ops.object.modifier_apply(modifier=bm.name)
    bpy.data.objects.remove(temp,do_unlink=True);cars.remove(temp)
norm=body.modifiers.new('Smooth paint normals','WEIGHTED_NORMAL');norm.keep_sharp=True
for s in (-1,1):
    curve('BodyPaint_Shoulder_'+str(s),[
        (s*.97,1.115,-2.05),(s*1.102,1.2,-1.05),
        (s*1.113,1.208,0),(s*1.08,1.185,1.25),(s*.974,1.04,2.26)],.009,PAINT)
    for z in (-.2,1.37):curve(f'PanelSeam_{s}_{z}',[(s*1.115,1.16,z),(s*1.13,.84,z),(s*1.102,.57,z)],.004,PILLAR)
    for z in (-.56,.90):box(f'Chrome_DoorHandle_{s}_{z}',(s*1.137,1.065,z),(.105,.05,.24),CHROME,.018)
    box(f'BodyPaint_DoorMirror_{s}',(s*1.15,1.225,-.98),(.31,.16,.27),PAINT,.06)
    box(f'MirrorGlass_{s}',(s*1.315,1.23,-.98),(.025,.11,.21),GLASS,.009)
    curve(f'NN_LowerTrim_{s}',[(s*1.05,.54,-1.23),(s*1.13,.535,-.16),(s*1.07,.53,1.30)],.011,CHROME)
    box(f'CarbonSideSkirt_{s}',(s*1.054,.405,0),(.11,.055,3.55),DARK,.018)

# Curved cabin loft with slanted windshields and 4 individual side windows.
roof=loft_profile([
 (-1.19,1.22,1),(-1.02,1.42,.965),(-.76,1.70,.89),(-.59,1.818,.844),
 (-.41,1.838,.82),(.22,1.852,.815),(.62,1.817,.84),
 (.84,1.75,.88),(1.13,1.46,.97),(1.49,1.20,1.038)],7)
verts=[];faces=[]
for z,y,w in roof:verts.extend([(-1.023,1.21,z),(-w,y,z),(0,y+.014,z),(w,y,z),(1.023,1.21,z)])
for i in range(len(roof)-1):
    for j in range(4):
        a=i*5+j;b=(i+1)*5+j
        faces.extend(((a,b,a+1),(a+1,b,b+1)))
mesh('BodyPaint_FlowingRoof',verts,faces,PAINT,smooth=True)
patch('WindowGlass_Windshield',[
    (-.953,1.245,-1.16),(.953,1.245,-1.16),(.838,1.803,-.592),(-.838,1.803,-.592)],GLASS)
patch('WindowGlass_RearWindshield',[
    (-.837,1.804,.78),(.837,1.804,.78),(.978,1.231,1.464),(-.978,1.231,1.464)],GLASS)
for s in (-1,1):
    patch(f'WindowGlass_FrontDoor_{s}',[
        (s*.974,1.245,-1.10),(s*.849,1.795,-.585),(s*.835,1.821,.03),(s*1.027,1.24,.03)],GLASS)
    patch(f'WindowGlass_RearDoor_{s}',[
        (s*.833,1.823,.113),(s*.861,1.786,.752),(s*.982,1.245,1.438),(s*1.031,1.245,.115)],GLASS)
    curve(f'Chrome_WindowTrim_{s}',[
        (s*.978,1.237,-1.13),(s*.852,1.824,-.58),(s*.839,1.857,-.34),
        (s*.837,1.856,.35),(s*.86,1.812,.77),(s*.995,1.238,1.46)],.014,CHROME)
    curve(f'Black_BPillar_{s}',[(s*.835,1.849,.07),(s*1.038,1.24,.071)],.028,PILLAR)
    curve(f'Black_WindowBelt_{s}',[(s*.981,1.237,-1.14),(s*1.04,1.24,.08),(s*.993,1.238,1.47)],.016,PILLAR)

for s in (-1,1):
    for z in (-.25,.87):
        box(f'Interior_SeatLower_{s}_{z}',(s*.43,.85,z),(.50,.18,.65),SEAT,.09)
        box(f'Interior_SeatUpper_{s}_{z}',(s*.43,1.23,z+.21),(.53,.62,.18),SEAT,.09)
        box(f'Interior_HeadRest_{s}_{z}',(s*.43,1.59,z+.25),(.31,.19,.14),INTERIOR,.06)
box('Interior_Dashboard',(0,1.15,-.94),(1.78,.18,.32),INTERIOR,.09)

# NN original grille, individual projector lights, and bright accent signatures.
patch('GrilleMesh_Front',[
    (-.66,.75,-2.575),(.66,.75,-2.575),(.89,1.015,-2.482),(0,1.105,-2.491),(-.89,1.015,-2.482)],MESH)
curve('Chrome_GrilleFrame',[
    (-.67,.744,-2.581),(.67,.744,-2.581),(.9,1.013,-2.50),
    (0,1.11,-2.50),(-.9,1.013,-2.50),(-.67,.744,-2.581)],.026,CHROME)
for row in range(5):
    for col in range(11):
        x=(col-5)*(.57+.05*row)/5
        box(f'NN_GrillePoint_{row}_{col}',(x,.77+row*.054,-2.589+row*.011),(.024,.012,.025),CHROME,.004)
box('NN_CarbonIntake',(0,.535,-2.559),(1.61,.16,.07),MESH,.02)
box('NN_CarbonSplitter',(0,.405,-2.47),(1.82,.075,.32),DARK,.03)
for s in (-1,1):
    patch(f'HeadlightLens_{s}',[
        (s*.605,1.068,-2.507),(s*.94,1.108,-2.376),
        (s*1.07,1.204,-1.945),(s*.95,1.012,-2.385)],LED)
    curve(f'NN_SignatureLight_{s}',[
        (s*.610,1.077,-2.52),(s*.88,1.127,-2.417),(s*1.076,1.212,-1.959)],.019,CYAN)
    patch(f'NN_AmberCorner_{s}',[
        (s*.982,1.104,-2.352),(s*1.073,1.194,-1.951),(s*.962,1.064,-2.358)],AMBER)
    for x,z in ((.78,-2.454),(.93,-2.389)):
        box(f'HeadlightProjector_{s}_{x}',(s*x,1.07,z),(.1,.075,.04),CHROME,.016)
    box(f'NN_FogIntake_{s}',(s*.81,.56,-2.51),(.42,.16,.09),MESH,.018)
    box(f'NN_FogLamp_{s}',(s*.79,.575,-2.566),(.22,.08,.04),LED,.012)
box('NN_Badge_Front',(0,1.055,-2.533),(.16,.064,.04),CYAN,.013)
box('NN_FrontPlate',(0,.83,-2.597),(.49,.14,.025),PLATE,.009)

for s in (-1,1):
    patch(f'TailRed_{s}',[
        (s*.44,1.12,2.485),(s*1,1.067,2.326),(s*.97,.859,2.505),(s*.43,.882,2.574)],RED)
    patch(f'TaillightReverse_{s}',[
        (s*.442,1.014,2.578),(s*.86,1.006,2.50),(s*.833,.947,2.525),(s*.448,.946,2.587)],REVERSE)
    curve(f'NN_RearSignature_{s}',[
        (s*.44,1.127,2.511),(s*.83,1.115,2.422),(s*.99,1.071,2.348)],.014,CYAN)
    box(f'NN_RearFin_{s}',(s*.66,.45,2.54),(.11,.21,.25),DARK,.019)
box('NN_DeckTrim',(0,1.015,2.568),(.95,.067,.05),CHROME,.009)
box('NN_RearPlate',(0,.77,2.612),(.50,.17,.034),PLATE,.007)
box('NN_RearDiffuser',(0,.392,2.485),(1.58,.08,.32),DARK,.024)
curve('BodyPaint_Ducktail',[(-.85,1.048,2.29),(0,1.086,2.476),(.85,1.048,2.29)],.025,PAINT)
for s in (-1,1):
    cyl(f'NN_Exhaust_{s}',(s*.69,.47,2.633),.087,.11,CHROME,20)

# Physically layered alloy wheels with separate spokes, brake discs and calipers.
for s in (-1,1):
    for axle,z in (('Front',-1.52),('Rear',1.52)):
        pref=f'Wheel_{axle}_{"R" if s>0 else "L"}'
        cx=s*1.078;center=(cx,.49,z)
        torus(pref+'_Sidewall',center,.363,.115,RUBBER)
        cyl(pref+'_InnerTire',center,.37,.26,RUBBER)
        exposed=cx+s*.144
        cyl(pref+'_BrakeDisc',(exposed,.49,z),.326,.023,CHROME)
        cyl(pref+'_Rim',(exposed+s*.024,.49,z),.305,.05,RIM)
        cyl(pref+'_DarkBarrel',(exposed+s*.052,.49,z),.265,.045,MESH)
        torus(pref+'_Lip',(exposed+s*.083,.49,z),.287,.018,CHROME)
        cyl(pref+'_Hub',(exposed+s*.096,.49,z),.079,.051,CHROME)
        for i in range(10):
            a=i*math.tau/10;x=exposed+s*.081
            curve(pref+f'_Spoke_{i}',[
                (x,.49+math.cos(a)*.087,z+math.sin(a)*.087),
                (x,.49+math.cos(a)*.263,z+math.sin(a)*.263)],.023,RIM)
        box(pref+'_Caliper',(exposed-s*.018,.71,z+.15),(.045,.16,.12),BRAKE,.02)

# Export the runtime car separately, excluding cameras, lights and stage.
bpy.ops.object.select_all(action='DESELECT')
for o in cars:
    if o.name in bpy.data.objects:o.select_set(True)
bpy.context.view_layer.objects.active=body
bpy.ops.export_scene.gltf(filepath=str(GLB),export_format='GLB',use_selection=True,
    export_yup=True,export_cameras=False,export_lights=False,export_animations=False)
print('GLB generated',GLB,GLB.stat().st_size)

# Editorial studio is saved with .blend, but not part of the runtime .glb asset.
FLOOR=mat('StudioFloor',(.095,.14,.19),.5,.24)
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.041))
floor=bpy.context.object;floor.name='STUDIO__PolishedFloor';floor.data.materials.append(FLOOR)
world=bpy.context.scene.world or bpy.data.worlds.new('NaijaNitro Studio World')
bpy.context.scene.world=world;world.use_nodes=True
bg=world.node_tree.nodes.get('Background')
bg.inputs['Color'].default_value=(.09,.14,.18,1);bg.inputs['Strength'].default_value=.3
def area(name,where,power,color,width,height,target=(0,.75,0)):
    d=bpy.data.lights.new(name,'AREA');o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o)
    o.location=P(where);o.rotation_euler=(P(target)-o.location).to_track_quat('-Z','Y').to_euler()
    d.energy=power;d.shape='RECTANGLE';d.size=width;d.size_y=height;d.color=color
area('STUDIO__Softbox',(-4,7,-5),1500,(.84,.93,1),7,4)
area('STUDIO__RearRim',(4,6,5),1750,(.24,.70,1),5,2)
area('STUDIO__Fill',(7,3,-5),1250,(1,.92,.85),6,3)
area('STUDIO__TopStrip',(0,9,-1),950,(.83,1,.96),9,2)
area('STUDIO__GreenRim',(-6,4,1),550,(.20,1,.79),4,2)
def camera(name,where,target,lens):
    d=bpy.data.cameras.new(name);o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o)
    o.location=P(where);o.rotation_euler=(P(target)-o.location).to_track_quat('-Z','Y').to_euler()
    d.lens=lens;return o
front=camera('STUDIO__FrontHero',(7.1,2.8,-9.6),(0,.96,0),53)
rear=camera('STUDIO__RearHero',(-7.4,3.2,9.5),(0,.96,0),55)
sc=bpy.context.scene
sc.render.engine='BLENDER_EEVEE_NEXT' if bpy.app.version>=(4,2,0) else 'BLENDER_EEVEE'
sc.render.resolution_x=1400;sc.render.resolution_y=880;sc.render.resolution_percentage=100
sc.render.image_settings.file_format='PNG'
sc.view_settings.view_transform='AgX' if bpy.app.version>=(4,0,0) else 'Filmic'
sc.camera=front
bpy.ops.wm.save_as_mainfile(filepath=str(BLEND))
sc.render.filepath=str(FRONT);bpy.ops.render.render(write_still=True)
sc.camera=rear;sc.render.filepath=str(REAR);bpy.ops.render.render(write_still=True)
print('Studio renders',FRONT,REAR)
