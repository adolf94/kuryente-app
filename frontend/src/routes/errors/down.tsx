import { createFileRoute } from "@tanstack/react-router";

const DownError = ()=>{
    return <>Down</>
}
export const Route = createFileRoute("/errors/down")({
  component: DownError,
})

