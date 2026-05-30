import cv2

camera = cv2.VideoCapture(0)

while True:
    ret, frame = camera.read()

    cv2.imshow("Crash Camera", frame)

    key = cv2.waitKey(1)

    if key == ord('c'):
        cv2.imwrite("crash_image.jpg", frame)
        print("Image Captured Successfully")

    elif key == ord('q'):
        break

camera.release()
cv2.destroyAllWindows()