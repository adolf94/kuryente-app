import { createFileRoute } from "@tanstack/react-router";

const Denied = ()=>{
    return <>Down</>
}
export const Route = createFileRoute("/errors/denied")({
  component: Denied,
})

 