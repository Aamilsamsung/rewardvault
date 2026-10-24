import {NextRequest,NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
import {timingSafeEqual} from "node:crypto";
export const dynamic="force-dynamic";
function equal(a:string,b:string){const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y)}
export async function GET(req:NextRequest){
 const expected=process.env.CPX_POSTBACK_TOKEN||"";
 const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY||"";
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL||"";
 if(!expected||expected.length<32||!serviceKey||!url)return new NextResponse("Not configured",{status:503});
 const q=req.nextUrl.searchParams;
 if(!equal(q.get("token")||"",expected))return new NextResponse("Forbidden",{status:403});
 const transaction=q.get("trans_id")||"";
 const user=q.get("user_id")||"";
 const rawPoints=q.get("amount_local")||"";
 const status=q.get("status")||"";
 if(!/^[\w.:-]{4,200}$/.test(transaction)||!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(user)||!/^[1-9]\d{0,5}$/.test(rawPoints)||!["1","2"].includes(status))return new NextResponse("Invalid callback",{status:400});
 const points=Number(rawPoints);
 if(points>100000)return new NextResponse("Invalid amount",{status:400});
 const admin=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data,error}=await admin.rpc("apply_cpx_event",{p_transaction_id:transaction,p_user_id:user,p_points:points,p_status:status==="1"?"completed":"reversed"});
 if(error){console.error("CPX callback rejected",error.code);return new NextResponse("Processing failed",{status:422})}
 return new NextResponse(String(data),{status:200,headers:{"Cache-Control":"no-store"}});
}
