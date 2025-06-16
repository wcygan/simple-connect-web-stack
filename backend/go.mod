module github.com/wcygan/simple-connect-web-stack

go 1.24

require (
	buf.build/gen/go/wcygan/simple-connect-web-stack/connectrpc/go v1.18.1-20250615194027-1ba9625cc7f0.1
	buf.build/gen/go/wcygan/simple-connect-web-stack/protocolbuffers/go v1.36.6-20250615194027-1ba9625cc7f0.1
	connectrpc.com/connect v1.18.1
	github.com/go-sql-driver/mysql v1.8.1
	github.com/google/uuid v1.6.0
	google.golang.org/protobuf v1.36.6
	// Testing dependencies
	github.com/DATA-DOG/go-sqlmock v1.5.2
	github.com/stretchr/testify v1.10.0
)

require (
	filippo.io/edwards25519 v1.1.0 // indirect
	github.com/davecgh/go-spew v1.1.1 // indirect
	github.com/pmezard/go-difflib v1.0.0 // indirect
	gopkg.in/yaml.v3 v3.0.1 // indirect
)
