import {NextRequest,NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
import {createHash} from "node:crypto";
export const dynamic="force-dynamic";
export async function GET(req:NextRequest){
 const appId=process.env.CPX_APP_ID;
 const secret=process.env.CPX_SECURE_HASH;
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!appId||!secret||!url||!key)return NextResponse.json({error:"CPX surveys are not yet configured."},{status:503});
 const header=req.headers.get("authorization")||"";
 if(!header.startsWith("Bearer "))return NextResponse.json({error:"Authentication required"},{status:401});
 const supabase=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data,error}=await supabase.auth.getUser(header.slice(7));
 if(error||!data.user)return NextResponse.json({error:"Invalid session"},{status:401});
 const userId=data.user.id;
 const hash=createHash("md5").update(userId+"-"+secret).digest("hex");
 const wall=new URL("https://offers.cpx-research.com/index.php");
 wall.searchParams.set("app_id",appId);
 wall.searchParams.set("ext_user_id",userId);
 wall.searchParams.set("secure_hash",hash);
 wall.searchParams.set("output_method","iframe");
 return NextResponse.json({url:wall.toString()},{headers:{"Cache-Control":"no-store"}});
}
