# Preserve the existing PostgreSQL 15.18 Alpine base and database format.
FROM postgres@sha256:3d0f7584ed7d04e27fa050d6683a74746608faf21f202be78460d679cc56461f AS builder
RUN apk add --no-cache build-base git
RUN git clone --depth 1 --branch v0.8.6 https://github.com/pgvector/pgvector.git /tmp/pgvector
WORKDIR /tmp/pgvector
RUN make OPTFLAGS="" with_llvm=no && make install DESTDIR=/out with_llvm=no

FROM postgres@sha256:3d0f7584ed7d04e27fa050d6683a74746608faf21f202be78460d679cc56461f
COPY --from=builder /out/usr/local/ /usr/local/
