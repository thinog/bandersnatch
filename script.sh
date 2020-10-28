ASSETSFOLDER=assets/timeline

for mediaFile in `ls $ASSETSFOLDER | grep .mp4`; do
    INPUT=$ASSETSFOLDER/$mediaFile
    FILENAME=$(echo $mediaFile | sed -n 's/.mp4//p' | sed -n 's/-1920x1080//p')    
    DURATION=$(ffprobe -i $INPUT -show_format -v quiet | sed -n 's/duration=//p')
    FOLDER_TARGET=$ASSETSFOLDER/$FILENAME

    mkdir -p $FOLDER_TARGET

    OUTPUT=$ASSETSFOLDER/$FILENAME/$FILENAME
    OUTPUT720=$OUTPUT-$DURATION-720.mp4 
    OUTPUT360=$OUTPUT-$DURATION-360.mp4
    OUTPUT144=$OUTPUT-$DURATION-144.mp4

    echo "Rendering video '$OUTPUT720' in 720p..."
    ffmpeg -y -i $INPUT \
        -c:a aac -ac 2 \
        -vcodec h264 -acodec aac \
        -ab 128k \
        -movflags frag_keyframe+empty_moov+default_base_moof \
        -b:v 1500k \
        -maxrate 1500k \
        -bufsize 1000k \
        -vf "scale=-1:720" \
        -v quiet \
        $OUTPUT720

    echo "Rendering video '$OUTPUT360' in 360p..."
    ffmpeg -y -i $INPUT \
        -c:a aac -ac 2 \
        -vcodec h264 -acodec aac \
        -ab 128k \
        -movflags frag_keyframe+empty_moov+default_base_moof \
        -b:v 400k \
        -maxrate 400k \
        -bufsize 400k \
        -vf "scale=-1:360" \
        -v quiet \
        $OUTPUT360

    echo "Rendering video '$OUTPUT144' in 144p..."
    ffmpeg -y -i $INPUT \
        -c:a aac -ac 2 \
        -vcodec h264 -acodec aac \
        -ab 128k \
        -movflags frag_keyframe+empty_moov+default_base_moof \
        -b:v 300k \
        -maxrate 300k \
        -bufsize 300k \
        -vf "scale=256:144" \
        -v quiet \
        $OUTPUT144
done
