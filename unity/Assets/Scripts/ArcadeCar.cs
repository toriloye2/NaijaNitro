using UnityEngine;
namespace NaijaNitro {
[RequireComponent(typeof(Rigidbody))]
public class ArcadeCar : MonoBehaviour {
 public float acceleration=12f, brake=20f, topSpeed=38f, boostSpeed=53f, grip=9f, turnRate=85f;
 public float Nitro {get; private set;}=100f;
 public float Speed => body.linearVelocity.magnitude*3.6f;
 public Transform[] frontWheels, rearWheels;
 Rigidbody body; float steer, spin; public float TouchSteer, TouchThrottle; public bool TouchBoost, TouchDrift;
 void Awake(){body=GetComponent<Rigidbody>();body.centerOfMass=new Vector3(0,-.35f,0);body.interpolation=RigidbodyInterpolation.Interpolate;}
 void FixedUpdate(){
 float dt=Time.fixedDeltaTime;
 float throttle=Mathf.Clamp(Input.GetAxisRaw("Vertical")+TouchThrottle,-1,1);
 steer=Mathf.MoveTowards(steer,Mathf.Clamp(Input.GetAxisRaw("Horizontal")+TouchSteer,-1,1),4f*dt);
 bool drift=Input.GetKey(KeyCode.Space)||TouchDrift;
 Vector3 local=transform.InverseTransformDirection(body.linearVelocity);
 bool boost=(Input.GetKey(KeyCode.LeftShift)||TouchBoost)&&throttle>0&&Nitro>0&&local.z>2;
 Nitro=Mathf.Clamp(Nitro+(boost?-25f:drift?7f:3f)*dt,0,100);
 float limit=boost?boostSpeed:topSpeed;
 float target=throttle>=0?throttle*limit:local.z>1?0:throttle*7f;
 local.z=Mathf.MoveTowards(local.z,target,(throttle<0?brake:boost?acceleration*1.6f:acceleration)*dt);
 local.x=Mathf.MoveTowards(local.x,0,(drift?grip*.2f:grip)*dt);
 body.linearVelocity=transform.TransformDirection(local);
 float yaw=steer*turnRate*Mathf.Clamp01(Mathf.Abs(local.z)/4f)/(1+Mathf.Abs(local.z)*.025f)*(drift?1.4f:1f)*Mathf.Sign(local.z)*dt;
 body.MoveRotation(body.rotation*Quaternion.Euler(0,yaw,0));
 spin+=local.z*dt*180f/(Mathf.PI*.35f);
 if(frontWheels!=null)foreach(var wheel in frontWheels)if(wheel)wheel.localRotation=Quaternion.Euler(spin,steer*28f,0);
 if(rearWheels!=null)foreach(var wheel in rearWheels)if(wheel)wheel.localRotation=Quaternion.Euler(spin,0,0);
 }
}
}