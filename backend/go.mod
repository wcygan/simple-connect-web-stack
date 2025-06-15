module github.com/wcygan/simple-connect-web-stack

go 1.23

require (
	buf.build/gen/go/wcygan/simple-connect-web-stack/connectrpc/go v1.18.1-20250615194027-1ba9625cc7f0.1
	buf.build/gen/go/wcygan/simple-connect-web-stack/protocolbuffers/go v1.36.6-20250615194027-1ba9625cc7f0.1
	connectrpc.com/connect v1.18.1
	github.com/go-sql-driver/mysql v1.8.1
	github.com/google/uuid v1.6.0
	google.golang.org/protobuf v1.36.6
)

require filippo.io/edwards25519 v1.1.0 // indirect
