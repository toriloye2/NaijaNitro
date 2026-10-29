"""Original Lagos-inspired shoreline assets for Naija Nitro.
Run: blender --background --python tools/build_lagos_blender.py
Uses Blender geometry/modifiers/PBR materials, exporting browser-ready glTF.
World authoring uses game coordinates (x, height, z) converted to Blender XYZ.
"""
import bpy, math
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]
GLB=ROOT/'public/environments/lagos_shore.glb'
BLEND=ROOT/'assets/blender/lagos_shore.blend'
for path in (GLB, BLEND): path.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
def xyz(x,y,z): return (x,-z,y)
def material(name,color,metal=0,rough=.76):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
 node=m.node_tree.nodes.get('Principled BSDF')
 node.inputs['Base Color'].default_value=(*color,1)
 node.inputs['Metallic'].default_value=metal;node.inputs['Roughness'].default_value=rough
 return m
plaster=[material('Plaster%02d'%i,col) for i,col in enumerate(((.67,.65,.57),(.83,.73,.59),(.68,.71,.68),(.72,.56,.48),(.84,.81,.73)))]
roof=material('Weathered concrete',(.43,.45,.43))
window=material('Blue glazed window',(.07,.20,.26),.42,.26)
trim=material('Painted steel',(.17,.19,.20),.52,.4)
cloth=[material('Awning%02d'%i,col) for i,col in enumerate(((.06,.34,.26),(.82,.51,.1),(.72,.19,.11),(.13,.3,.56)))]
bark=material('Palm bark',(.35,.25,.17))
leaf=material('Palm foliage',(.10,.32,.12))
def cube(name,pos,size,mat,bevel=0):
 bpy.ops.mesh.primitive_cube_add(size=1,location=xyz(*pos))
 o=bpy.context.object;o.name=name;o.dimensions=(size[0],size[2],size[1])
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 o.data.materials.append(mat)
 if bevel:
  mod=o.modifiers.new('Soft edges','BEVEL');mod.width=bevel;mod.segments=2
  o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
 return o
def tower(i):
 tall=i%3==0;count=(6+i%6) if tall else (2+i%3)
 w=(10+i%4*3) if tall else (12+i%3*3)
 d=12+i%4*2;step=3.5 if tall else 3.1;h=count*step
 x=(i*53%500)-250;z=(1 if i%2 else -1)*(265+(i*31%85))
 # Facing the track: distribute windows on both sides.
 cube('Building_%02d'%i,(x,h/2-2.82,z),(w,h,d),plaster[i%len(plaster)],.16)
 cube('Roof_slab_%02d'%i,(x,h-2.65,z),(w+.65,.35,d+.65),roof,.06)
 for f in range(count):
  y=f*step+1.83-2.82
  for j in range(3):
   u=(j-1)*w*.29
   for side in (-1,1):
    pz=z+side*(d/2+.05)
    cube('Inset_glass_%d_%d_%d_%d'%(i,f,j,side),(x+u,y,pz),(w*.18,1.5,.09),window,.045)
    cube('Window_frame_%d_%d_%d_%d'%(i,f,j,side),(x+u,y,pz+side*.08),(.075,1.6,.07),trim)
  if f>0:
   for side in (-1,1):
    cube('Balcony_slab_%d_%d_%d'%(i,f,side),(x,y-.94,z+side*(d/2+.48)),(w+.2,.14,1.0),roof,.04)
    cube('Balcony_rail_%d_%d_%d'%(i,f,side),(x,y-.38,z+side*(d/2+.94)),(w+.1,.09,.08),trim)
 if not tall:
  for side in (-1,1):
   cube('Market_awning_%d_%d'%(i,side),(x,-.17,z+side*(d/2+1)),(w*.93,.14,2.1),cloth[i%4],.055)
 cube('Roof_water_tank_%d'%i,(x+w*.24,h-1.7,z),(1.8,1.7,1.8),trim,.16)
def palm(i):
 x=(i*79%520)-260;z=(1 if i%2 else -1)*(252+(i*13%30));y=-2.82
 height=7+i%4
 # Curved tapered trunk, actual mesh with smooth shading.
 pts=[Vector(xyz(x,y,z)),Vector(xyz(x+.24,y+height*.46,z)),Vector(xyz(x+.46,y+height*.79,z+.1)),Vector(xyz(x+.19,y+height,z))]
 curve=bpy.data.curves.new('PalmTrunk','CURVE');curve.dimensions='3D';curve.bevel_depth=.2;curve.bevel_resolution=2
 spl=curve.splines.new('BEZIER');spl.bezier_points.add(len(pts)-1)
 for p,v in zip(spl.bezier_points,pts):p.co=v;p.handle_left_type='AUTO';p.handle_right_type='AUTO'
 ob=bpy.data.objects.new('Palm_trunk_%d'%i,curve);bpy.context.collection.objects.link(ob);ob.data.materials.append(bark)
 for f in range(8):
  a=math.tau*f/8;coords=[]
  for k in range(7):
   t=k/6
   xx=x+.19+math.cos(a)*3.7*t
   zz=z+math.sin(a)*3.7*t
   yy=y+height+.55*math.sin(t*math.pi)-1.35*t*t
   # leaf strip width tapers at tips
   wd=.52*math.sin(math.pi*t)
   coords.extend([xyz(xx-math.sin(a)*wd,yy,zz+math.cos(a)*wd),xyz(xx+math.sin(a)*wd,yy,zz-math.cos(a)*wd)])
  faces=[(k*2,k*2+1,k*2+3,k*2+2) for k in range(6)]
  mesh=bpy.data.meshes.new('Leafmesh');mesh.from_pydata(coords,[],faces);mesh.update()
  ob=bpy.data.objects.new('Palm_frond_%d_%d'%(i,f),mesh);bpy.context.collection.objects.link(ob);ob.data.materials.append(leaf)
for i in range(44):tower(i)
for i in range(36):palm(i)
# Object transforms are applied in Blender, then GLB exporter handles Y-up coordinates.
bpy.ops.wm.save_as_mainfile(filepath=str(BLEND))
bpy.ops.export_scene.gltf(filepath=str(GLB),export_format='GLB',export_apply=True,export_yup=True,export_animations=False,export_cameras=False,export_lights=False)
print('Exported',GLB)
