using UnityEngine;
namespace NaijaNitro {
[RequireComponent(typeof(Camera))]
public class ChaseCamera : MonoBehaviour {
 public Transform target; public ArcadeCar car; public Vector3 offset=new Vector3(0,3.2f,-7.5f);
 Camera cam;
 void Awake(){cam=GetComponent<Camera>();}
 void LateUpdate(){if(!target)return;float t=1-Mathf.Exp(-7*Time.deltaTime);Vector3 desired=target.TransformPoint(offset);Vector3 focus=target.position+Vector3.up*1.2f;Vector3 ray=desired-focus;if(Physics.SphereCast(focus,.2f,ray.normalized,out RaycastHit hit,ray.magnitude,~0,QueryTriggerInteraction.Ignore)&&!hit.transform.IsChildOf(target)&&hit.transform!=target)desired=focus+ray.normalized*Mathf.Max(.5f,hit.distance-.3f);transform.position=Vector3.Lerp(transform.position,desired,t);transform.rotation=Quaternion.Slerp(transform.rotation,Quaternion.LookRotation(focus+target.forward*3-transform.position),t);cam.fieldOfView=Mathf.Lerp(cam.fieldOfView,62+Mathf.Min(12,car?car.Speed*.06f:0),t);}
}
}