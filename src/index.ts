import * as dotenv from 'dotenv'
dotenv.config()

import * as vision from '@google-cloud/vision'
import * as fs from 'fs/promises'

import { createCanvas , loadImage } from 'canvas'

async function main( ) {

    const dirs = await fs.readdir('.')

    if (!dirs.includes("out")) fs.mkdir('./out')
    if (!dirs.includes("images")) fs.mkdir('./out')

    const images = await fs.readdir(`./images`)
    console.log( images )

    const client = new vision.ImageAnnotatorClient()


    for ( const imgpath of images ) {

        const path = `./images/${ imgpath }`

        const results = await client.textDetection( path )
        const result = results[0]

        console.log( result.fullTextAnnotation?.pages?.at(0)?.blocks?.at(0)?.boundingBox )

        if ( result.fullTextAnnotation?.pages ){

            const img = await loadImage( path )
            const canvas = createCanvas( img.width , img.height )
            const ctx = canvas.getContext("2d")

            ctx.drawImage( img , 0 , 0 )

            if ( result.textAnnotations)
                for ( const text of result.textAnnotations ) {
                    let vert = text.boundingPoly?.vertices
                    if ( vert ) {
                        let paths = [
                                vert[0] , vert[1] ,
                                vert[1] , vert[2] ,
                                vert[2] , vert[3] ,
                                vert[3] , vert[0] ,
                        ]

                        ctx.strokeStyle = "rgba(0,255,0,0.5)"
                        ctx.lineWidth = 5 

                        ctx.beginPath()
                    
                        paths.forEach( p => ctx.lineTo(p.x!,p.y!)  )

                        ctx.stroke()
                    }
                }

            for ( const text of result.fullTextAnnotation.pages ) {

                if (!text.blocks)
                    continue

                for ( const block of text.blocks ) {
                    let bbs = block.boundingBox
                    if (!bbs || !bbs.normalizedVertices )
                        continue

                    let vert = bbs.vertices
                    if (!vert)
                        continue
                    let paths = [
                            vert[0] , vert[1] ,
                            vert[1] , vert[2] ,
                            vert[2] , vert[3] ,
                            vert[3] , vert[0] ,
                    ]


                    ctx.strokeStyle = "rgba(255,0,0,0.5)"
                    ctx.lineWidth = 5 

                    ctx.beginPath()
                  
                    paths.forEach( p => ctx.lineTo(p.x!,p.y!)  )

                    ctx.stroke()

                }

            }

            await fs.writeFile(`./out/${imgpath}.png` , canvas.toBuffer("image/png") )

        }

        await fs.writeFile(`./out/${imgpath}_log.txt` , result.fullTextAnnotation?.text ?? "" )
    }




}


Promise.all(
    [
        main()
    ]
)
