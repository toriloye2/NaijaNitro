using UnityEngine;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEditor.Build.Reporting;
using UnityEngine.SceneManagement;
using System.IO;
namespace NaijaNitro {
public static class PrototypeBuilder {
 static Material Mat(string name, Color c) {
  Directory.CreateDirectory("Assets/Generated");
  string path="Assets/Generated/"+name+".mat";
  var m=AssetDatabase.LoadAssetAtPath<Material>(path);
  if(!m){m=new Material(Shader.Find("Standard"));AssetDatabase.CreateAsset(m,path);}
  m.color=c;return m;
 }
 static GameObject Shape(PrimitiveType type,string name,Vector3 p,Vector3 s,Material m,Transform parent=null,bool collision=true) {
  var o=GameObject.CreatePrimitive(type);o.name=name;if(parent)o.transform.SetParent(parent,false);
  o.transform.localPosition=p;o.transform.localScale=s;o.GetComponent<Renderer>().sharedMaterial=m;
  if(!collision)Object.DestroyImmediate(o.GetComponent<Collider>());return o;
 }
 [MenuItem("Naija Nitro/Create Lagos Test Scene")]
 public static void CreateScene(){
  var scene=EditorSceneManager.NewScene(NewSceneSetup.EmptyScene,NewSceneMode.Single);
  var asphalt=Mat("Asphalt",new Color(.15f,.17f,.19f));var concrete=Mat("Concrete",new Color(.7f,.72f,.69f));
  var water=Mat("Lagoon",new Color(.09f,.38f,.48f));var white=Mat("White",Color.white);
  var glass=Mat("Glass",new Color(.19f,.35f,.44f));var paint=Mat("SedanPaint",new Color(.12f,.24f,.38f));paint.SetFloat("_Metallic",.65f);paint.SetFloat("_Glossiness",.8f);
  var rubber=Mat("Rubber",new Color(.045f,.045f,.045f));var green=Mat("Palm",new Color(.15f,.37f,.12f));
  Shape(PrimitiveType.Cube,"Lagoon",new Vector3(0,-4,160),new Vector3(900,.2f,900),water,null,false);
  Shape(PrimitiveType.Cube,"Bridge deck",new Vector3(0,-.35f,80),new Vector3(24,.7f,360),asphalt);
  Shape(PrimitiveType.Cube,"Lekki approach",new Vector3(0,-.35f,-165),new Vector3(24,.7f,130),asphalt);
  for(int i=0;i<96;i++)for(int j=-1;j<=1;j++)Shape(PrimitiveType.Cube,"Lane marking",new Vector3(j*5,.012f,-225+i*5),new Vector3(.13f,.024f,2.7f),white,null,false);
  for(int i=0;i<36;i++)foreach(int side in new[]{-1,1}){
   Shape(PrimitiveType.Cube,"Bridge parapet",new Vector3(side*12,.45f,-95+i*10),new Vector3(.45f,.9f,10),concrete);
   if(i%3==0)Shape(PrimitiveType.Cylinder,"Bridge support",new Vector3(side*8,-2, -95+i*10),new Vector3(1.5f,2,1.5f),concrete,null,false);
  }
  foreach(int side in new[]{-1,1}){
   Shape(PrimitiveType.Cube,"Lekki shoreline",new Vector3(side*65,-.5f,-165),new Vector3(105,1,130),concrete);
   for(int i=0;i<10;i++){
    float h=8+(i%4)*4;float z=-222+i*12;
    Shape(PrimitiveType.Cube,"Apartment massing",new Vector3(side*44,h/2,z),new Vector3(18,h,10),concrete);
    for(int floor=0;floor<(int)(h/4);floor++){
     Shape(PrimitiveType.Cube,"Glazing",new Vector3(side*34.95f,2+floor*4,z),new Vector3(.12f,2.4f,8),glass,null,false);
     Shape(PrimitiveType.Cube,"Balcony",new Vector3(side*34, .6f+floor*4,z),new Vector3(2,.2f,10),white,null,false);
    }
    Shape(PrimitiveType.Cylinder,"Palm trunk",new Vector3(side*17,3,z),new Vector3(.35f,3,.35f),concrete,null,false);
    for(int leaf=0;leaf<7;leaf++){float a=leaf*Mathf.PI*2/7;var l=Shape(PrimitiveType.Sphere,"Palm frond",new Vector3(side*17+Mathf.Sin(a)*1.4f,6,z+Mathf.Cos(a)*1.4f),new Vector3(.55f,.2f,3),green,null,false);l.transform.rotation=Quaternion.Euler(0,a*Mathf.Rad2Deg,0);}
   }
  }
  var car=new GameObject("Player sedan");car.transform.position=new Vector3(0,.65f,-160);
  var rb=car.AddComponent<Rigidbody>();rb.mass=1350;rb.constraints=RigidbodyConstraints.FreezeRotationX|RigidbodyConstraints.FreezeRotationZ;
  var collider=car.AddComponent<BoxCollider>();collider.size=new Vector3(1.85f,1.1f,4.3f);collider.center=new Vector3(0,.15f,0);
  // Placeholder only: swap these meshes for the original Blender sedan before visual signoff.
  Shape(PrimitiveType.Sphere,"Rounded body proxy",new Vector3(0,.05f,0),new Vector3(1.9f,.95f,4.6f),paint,car.transform,false);
  Shape(PrimitiveType.Sphere,"Cabin proxy",new Vector3(0,.62f,-.15f),new Vector3(1.58f,.9f,2.45f),glass,car.transform,false);
  var controller=car.AddComponent<ArcadeCar>();
  controller.frontWheels=new Transform[2];controller.rearWheels=new Transform[2];
  for(int i=0;i<4;i++){var pivot=new GameObject("Wheel pivot").transform;pivot.SetParent(car.transform,false);pivot.localPosition=new Vector3(i%2==0?-.9f:.9f,-.28f,i<2?1.4f:-1.4f);var tire=Shape(PrimitiveType.Cylinder,"Tire",Vector3.zero,new Vector3(.72f,.14f,.72f),rubber,pivot,false);tire.transform.localRotation=Quaternion.Euler(0,0,90);if(i<2)controller.frontWheels[i]=pivot;else controller.rearWheels[i-2]=pivot;}
  var sun=new GameObject("Sun").AddComponent<Light>();sun.type=LightType.Directional;sun.intensity=1.2f;sun.shadows=LightShadows.Soft;sun.transform.rotation=Quaternion.Euler(35,-40,0);
  RenderSettings.ambientLight=new Color(.48f,.5f,.55f);RenderSettings.fog=true;RenderSettings.fogColor=new Color(.65f,.78f,.83f);RenderSettings.fogDensity=.003f;
  var cam=new GameObject("Chase camera").AddComponent<Camera>();cam.tag="MainCamera";cam.clearFlags=CameraClearFlags.SolidColor;cam.backgroundColor=RenderSettings.fogColor;cam.transform.position=car.transform.position+new Vector3(0,3.2f,-7.5f);cam.transform.LookAt(car.transform.position+Vector3.forward*3+Vector3.up);
  var follow=cam.gameObject.AddComponent<ChaseCamera>();follow.target=car.transform;follow.car=controller;
  Directory.CreateDirectory("Assets/Scenes");EditorSceneManager.SaveScene(scene,"Assets/Scenes/LagosTest.unity");EditorBuildSettings.scenes=new[]{new EditorBuildSettingsScene("Assets/Scenes/LagosTest.unity",true)};AssetDatabase.SaveAssets();
 }
 public static void BuildWindows(){CreateScene();Directory.CreateDirectory("Build");var report=BuildPipeline.BuildPlayer(new[]{"Assets/Scenes/LagosTest.unity"},"Build/NaijaNitro.exe",BuildTarget.StandaloneWindows64,BuildOptions.None);if(report.summary.result!=BuildResult.Succeeded)throw new System.Exception("Build failed: "+report.summary.result);}
}
}
